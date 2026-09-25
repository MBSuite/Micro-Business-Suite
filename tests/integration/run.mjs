#!/usr/bin/env node
// =====================================================
// Integration Security Test Harness
// รันใน Docker container postgres แยก (ไม่แตะ production)
//
// Flow:
//   1. ถ้า container mbs-integration-pg ยังไม่มี -> docker run (postgres:16-alpine)
//   2. สร้าง schema สำหรับ integration test (tests/integration/schema.sql)
//   3. รัน `next dev` บน port 3199 ด้วย DATABASE_URL ชี้ container test
//   4. รอ app พร้อม (poll /api/db_schema จนตอบ 401)
//   5. รัน tests/integration-security.test.mjs พร้อม MBS_TEST_*
//   6. kill dev server, คืน exit code ของ test
//
// ปลอดภัย: ทุกอย่างในเครื่อง (127.0.0.1:54329) ไม่แตะ DATABASE_URL ของ production
// =====================================================

import { spawn, spawnSync } from "node:child_process";
import { readFileSync, existsSync, renameSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import pg from "pg";

const ROOT = path.resolve(import.meta.dirname, "../..");
const ENV_LOCAL = path.join(ROOT, ".env.local");
const ENV_LOCAL_BAK = `${ENV_LOCAL}.integration-backup`;

const CONTAINER = "mbs-integration-pg";
const IMAGE = "postgres:16-alpine";
const DB_PORT = 54329; // ท้องถิ่น ไม่ชนกับ prod (5432)
const DB_NAME = "mbs_test";
const DB_USER = "postgres";
const DB_PASS = "mbs-test-only-local";
// sslmode=disable จำเป็น: lib/db.ts อ่าน sslmode จาก URL (default "require")
// แต่ postgres ข้างใน container ไม่เปิด SSL -> ถ้าไม่ปิดจะ 500 ทุก query
const TEST_DB_URL = `postgres://${DB_USER}:${DB_PASS}@127.0.0.1:${DB_PORT}/${DB_NAME}?sslmode=disable`;

const APP_PORT = 3199;
const BASE_URL = `http://127.0.0.1:${APP_PORT}`;
const JWT_SECRET = crypto.randomBytes(32).toString("hex");

function sh(cmd, { pipe = false } = {}) {
  const r = spawnSync(cmd, { shell: true, stdio: pipe ? "pipe" : "inherit" });
  return { status: r.status, stdout: (r.stdout || "").toString().trim() };
}

function ensureContainer() {
  const inspect = sh(`docker inspect ${CONTAINER} --format '{{.State.Status}}'`, { pipe: true });
  if (inspect.status === 0) {
    if (inspect.stdout === "running") return;
    sh(`docker start ${CONTAINER}`);
    return;
  }
  console.log("  [db] pulling/starting test postgres container...");
  const run = sh(
    `docker run -d --name ${CONTAINER} ` +
      `-e POSTGRES_PASSWORD=${DB_PASS} -e POSTGRES_DB=${DB_NAME} ` +
      `-p 127.0.0.1:${DB_PORT}:5432 ${IMAGE}`
  );
  if (run.status !== 0) {
    console.error("  [db] failed to start container:", run.status);
    process.exit(1);
  }
}

async function waitForDb() {
  const client = new pg.Client({ connectionString: TEST_DB_URL });
  for (let i = 0; i < 40; i++) {
    try {
      await client.connect();
      await client.query("SELECT 1");
      return client;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error("test postgres did not become ready in time");
}

async function applySchema(client) {
  // รีเซ็ตทุก run: กัน schema เก่า/ข้อมูลเก่าจากรอบที่แล้วแอบค้าง
  await client.query(
    `DROP TABLE IF EXISTS payment_vouchers, expenses, quotations, payments, invoice_items, invoices, contacts,
       company_settings, users, companies CASCADE`
  );
  const sql = readFileSync(path.join(import.meta.dirname, "schema.sql"), "utf8");
  await client.query(sql);
}

async function waitForApp() {
  for (let i = 0; i < 150; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/db_schema`, { redirect: "manual" });
      if (res.status === 401) return;
    } catch {
      // server ยังไม่เปิด
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`app did not become ready at ${BASE_URL}`);
}

function runTests() {
  const isTaxMode = process.argv.includes("--tax");
  const command = isTaxMode ? "tsx" : "node";
  const args = isTaxMode
    ? ["--test", path.join(ROOT, "tests/taxAutomator.test.ts")]
    : ["--test", path.join(ROOT, "tests/integration-security.test.mjs")];
  const env = {
    ...process.env,
    MBS_TEST_BASE_URL: BASE_URL,
    MBS_TEST_DATABASE_URL: TEST_DB_URL,
    MBS_TEST_JWT_SECRET: JWT_SECRET,
    // productionUrl ที่ test เอาไปเทียบ 'ไม่เท่ากับ' — ใส่ placeholder ที่ไม่เคยใช้จริง
    DATABASE_URL: "postgres://placeholder.invalid/mbs-prod-never-used",
    POSTGRES_URL: undefined,
  };
  delete env.POSTGRES_URL;

  const r = spawnSync("pnpm", ["exec", command, ...args], { stdio: "inherit", env });
  return r.status ?? 1;
}

async function main() {
  console.log("== integration harness: preparing isolated test db ==");

  // CRITICAL: Next.js โหลด .env.local ทับ env ที่ตั้งจาก shell (merge overwrite)
  // ถ้าปล่อยไว้ server จะต่อ DB จริงของ production -> test ที่ insert Fixture อาจแตะ prod
  // วิธี: สลับ .env.local ออกชั่วคราวระหว่างรัน harness แล้วคืนให้เสมอ
  const envLocalMoved = existsSync(ENV_LOCAL);
  if (envLocalMoved) {
    renameSync(ENV_LOCAL, ENV_LOCAL_BAK);
    console.log("  [env] .env.local ถูกพักไว้ (restore อัตโนมัติหลังเสร็จ)");
  }
  const restoreEnv = () => {
    if (envLocalMoved && existsSync(ENV_LOCAL_BAK) && !existsSync(ENV_LOCAL)) {
      renameSync(ENV_LOCAL_BAK, ENV_LOCAL);
      console.log("  [env] .env.local กลับที่เดิมแล้ว");
    }
  };
  process.on("exit", restoreEnv);

  try {
    ensureContainer();
    const dbClient = await waitForDb();
    try {
      await applySchema(dbClient);
      console.log("  [db] schema applied");
    } finally {
      await dbClient.end();
    }

    console.log(`== starting app on ${BASE_URL} (test db) ==`);
    const appEnv = {
      ...process.env,
      DATABASE_URL: TEST_DB_URL,
      NEXTAUTH_URL: BASE_URL,
      NEXTAUTH_SECRET: JWT_SECRET,
      AUTH_SECRET: JWT_SECRET,
      SESSION_MAX_AGE: "3600",
      LICENSE_SALT: "integration-test-license-salt-only",
      PORT: String(APP_PORT),
    };
    // รัน next ผ่าน node โดยตรง: ถ้ารันผ่าน `pnpm exec next` พอ app.kill() ที่ pnpm
    // ใบ้ leaf (next dev กลายเป็น orphan) -> bash session ค้างได้ถึง timeout
    const nextBin = path.join(ROOT, "node_modules/next/dist/bin/next");
    const app = spawn("node", [nextBin, "dev", "-p", String(APP_PORT)], {
      cwd: ROOT,
      env: appEnv,
      stdio: ["ignore", "inherit", "inherit"],
    });

    let appReady = false;
    try {
      await waitForApp();
      appReady = true;
      const testLabel = process.argv.includes("--tax") ? "taxAutomator tests" : "integration-security tests";
      console.log(`== app ready; running ${testLabel} ==`);
      const code = runTests();
      console.log(`== integration tests finished with exit code ${code} ==`);
      process.exitCode = code;
    } catch (err) {
      console.error("harness failed:", err.message);
      process.exitCode = 1;
    } finally {
      if (appReady || process.exitCode !== 0) {
        app.kill("SIGTERM");
        await new Promise((r) => setTimeout(r, 800));
        app.kill("SIGKILL");
      }
    }
  } finally {
    restoreEnv();
  }
}

main();