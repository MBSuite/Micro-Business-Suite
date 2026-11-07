#!/usr/bin/env node
// scripts/backup-prod.mjs
// Backup Neon production DB (read-only). Does NOT modify any data.
//
// Usage:
//   node scripts/backup-prod.mjs            # uses DATABASE_URL / POSTGRES_URL (pooled OK for backup)
//   node scripts/backup-prod.mjs --unpooled  # prefers unpooled/direct URL (PROD_UNPOOLED_URL / DATABASE_URL_UNPOOLED)
//   node scripts/backup-prod.mjs --url "<CONN_URL>"
//
// Safety: runs pg_dump only. No writes, no schema changes.

import { spawnSync } from "node:child_process";
import { mkdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

const args = process.argv.slice(2);
const unpooled = args.includes("--unpooled");
const urlFlagIdx = args.indexOf("--url");
const urlArg = urlFlagIdx >= 0 ? args[urlFlagIdx + 1] : null;

function pickUrl() {
  if (urlArg) return urlArg;
  if (unpooled) {
    return (
      process.env.PROD_UNPOOLED_URL ||
      process.env.DATABASE_URL_UNPOOLED ||
      process.env.POSTGRES_URL_UNPOOLED ||
      process.env.POSTGRES_URL ||
      process.env.DATABASE_URL
    );
  }
  return process.env.POSTGRES_URL || process.env.DATABASE_URL;
}

const dbUrl = pickUrl();
if (!dbUrl) {
  console.error("ERROR: No database URL found. Set POSTGRES_URL/DATABASE_URL or use --url.");
  process.exit(1);
}

// mask credentials for logging
const masked = dbUrl.replace(/\/\/[^@]+@/, "//***:***@");
console.log(`Target DB (masked): ${masked}`);
console.log(`Mode: ${unpooled ? "unpooled/direct" : "default"}\n`);

// check pg_dump
const check = spawnSync("which", ["pg_dump"], { encoding: "utf8" });
if (check.status !== 0) {
  console.error("ERROR: pg_dump not found. Install postgresql-client.");
  process.exit(1);
}

const backupsDir = join(process.cwd(), "backups");
if (!existsSync(backupsDir)) mkdirSync(backupsDir, { recursive: true });

const ts = new Date().toISOString().replace(/[:.]/g, "-");
const outFile = join(backupsDir, `backup-${ts}.sql`);

console.log(`Running pg_dump -> ${outFile}`);
const res = spawnSync(
  "pg_dump",
  ["--no-owner", "--no-acl", "--clean", "--if-exists", "-f", outFile, dbUrl],
  { stdio: "inherit" }
);

if (res.status !== 0) {
  console.error(`\nERROR: pg_dump failed (exit ${res.status}).`);
  process.exit(res.status || 1);
}

const size = statSync(outFile).size;
if (size === 0) {
  console.error("ERROR: backup file is empty.");
  process.exit(1);
}

console.log(`\n✅ Backup complete: ${outFile}`);
console.log(`   Size: ${(size / 1024).toFixed(1)} KB`);
console.log("   Verify: head -20 " + outFile);
console.log("   Restore: psql \"<URL>\" -f " + outFile);
