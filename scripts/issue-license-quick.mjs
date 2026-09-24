#!/usr/bin/env node
// =====================================================
// Micro Business Suite — License Key Issuer (แบบถามเป็นขั้น)
// รัน:  pnpm license:quick
// ตามตอบทีละข้อ → generate license key → แสดง + บันทึกลงไฟล์
// อ่าน LICENSE_SALT จาก .env.local (ต้องตรงกับฝั่ง app เสมอ)
// =====================================================

import readline from "node:readline";
import { once } from "node:events";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
require("dotenv").config({ path: ".env.local" });

const TYPES = ["TRIAL", "STANDARD", "PROFESSIONAL", "ENTERPRISE"];
const DEFAULT_FEATURES = {
  TRIAL: ["basic_access", "journal_engine", "tax_reporting"],
  STANDARD: ["basic_access", "journal_engine", "tax_reporting", "coa_management"],
  PROFESSIONAL: [
    "basic_access",
    "journal_engine",
    "advanced_reports",
    "automated_journaling",
    "coa_management",
    "tax_reporting",
  ],
  ENTERPRISE: [
    "basic_access",
    "journal_engine",
    "advanced_reports",
    "multi_company",
    "api_access",
    "custom_branding",
    "automated_journaling",
    "coa_management",
    "tax_reporting",
  ],
};

// --- ถามเป็นขั้นทีละข้อ (รองรับทั้ง TTY และ pipe) ---
const steps = [
  { key: "type",       msg: "License type",                       def: "PROFESSIONAL" },
  { key: "mode",       msg: "Mode (perpetual/subscription)",      def: "perpetual" },
  { key: "company",    msg: "ชื่อบริษัทลูกค้า (company)",          def: "Your Company" },
  { key: "licensee",   msg: "อีเมล licensee",                     def: "" },
  { key: "maxUsers",   msg: "จำนวนผู้ใช้ (max_users)",            def: "5" },
  { key: "maxTx",      msg: "ธุรกรรม/เดือน (max_transactions)",   def: "1000" },
  {
    key: "expires",
    msg: "วันหมดอายุ (YYYY-MM-DD)",
    def: "",
    only: (a) => a.mode === "subscription",
  },
];

const answers = {};
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
let i = 0;

function promptText(step) {
  return `${step.msg}${step.def ? ` [${step.def}]` : ""} `;
}

rl.setPrompt(promptText(steps[0]));
rl.prompt();

rl.on("line", (line) => {
  const step = steps[i];
  answers[step.key] = (line || "").trim() || step.def;
  i++;
  while (i < steps.length && steps[i].only && !steps[i].only(answers)) {
    answers[steps[i].key] = steps[i].def; // กำหนดค่า default สำหรับขั้นที่ถูกข้าม
    i++;
  }
  if (i < steps.length) {
    rl.setPrompt(promptText(steps[i]));
    rl.prompt();
  } else {
    rl.close();
  }
});

await once(rl, "close");

// --- validate ---
function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

const type = String(answers.type || "").toUpperCase();
if (!TYPES.includes(type)) fail(`--type ต้องเป็น ${TYPES.join(" / ")}`);

const mode = String(answers.mode || "").toLowerCase();
if (!["perpetual", "subscription"].includes(mode)) fail("mode ต้องเป็น perpetual หรือ subscription");

const company = String(answers.company || "").trim();
const licensee = String(answers.licensee || "").trim();
if (!licensee) fail("ต้องมี licensee (อีเมลลูกค้า)");

const maxUsers = Number(answers.maxUsers);
const maxTx = Number(answers.maxTx);
if (!Number.isInteger(maxUsers) || maxUsers < 1) fail("max_users ต้องเป็นจำนวนเต็ม >= 1");
if (!Number.isInteger(maxTx) || maxTx < 1) fail("max_transactions_per_month ต้องเป็นจำนวนเต็ม >= 1");

const expires = String(answers.expires || "").trim();
if (mode === "subscription" && !/^\d{4}-\d{2}-\d{2}$/.test(expires)) {
  fail("subscription ต้องระบุวันหมดอายุในรูป YYYY-MM-DD");
}

const salt = process.env.LICENSE_SALT;
if (!salt) fail("LICENSE_SALT ไม่ถูกตั้งค่าใน .env.local (สร้างด้วย: openssl rand -base64 48)");

const payload = {
  product: "micro-business-suite",
  mode,
  license_type: type,
  licensee,
  company,
  issued_at: new Date().toISOString(),
  ...(mode === "subscription" && expires ? { expires_at: `${expires}T23:59:59.999Z` } : {}),
  max_users: maxUsers,
  max_transactions_per_month: maxTx,
  allowed_features: DEFAULT_FEATURES[type] || DEFAULT_FEATURES.PROFESSIONAL,
};

function base64UrlEncode(v) {
  return Buffer.from(v).toString("base64url");
}
function hmacSignature(payloadB64) {
  return crypto.createHmac("sha256", salt).update(payloadB64).digest("base64url");
}

const payloadB64 = base64UrlEncode(JSON.stringify(payload));
const licenseKey = `MBS.${payloadB64}.${hmacSignature(payloadB64)}`;

// บันทึกลง .secure/licenses/ (0600, git-ignored) เพื่อให้เห็นประวัติที่ออกให้ใคร
const slug = company.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "license";
const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
const outDir = path.join(process.cwd(), ".secure", "licenses");
fs.mkdirSync(outDir, { recursive: true, mode: 0o700 });
const outPath = path.join(outDir, `${slug}-${stamp}.key`);
fs.writeFileSync(outPath, `${licenseKey}\n`, { mode: 0o600 });

console.log("");
console.log("================================================================");
console.log("✅ License Key Generated");
console.log("================================================================");
console.log(`  mode      : ${mode}`);
console.log(`  type      : ${type}`);
console.log(`  company   : ${company}`);
console.log(`  licensee  : ${licensee}`);
console.log(`  max_users : ${maxUsers}`);
console.log(`  max_tx/mo : ${maxTx}`);
console.log(`  issued    : ${payload.issued_at}`);
console.log(mode === "subscription" ? `  expires   : ${payload.expires_at}` : "  expires   : (ไม่มี — ขายขาด)");
console.log(`  features  : ${payload.allowed_features.join(", ")}`);
console.log("");
console.log("  LICENSE KEY (ใส่เป็น MBS_LICENSE_KEY ใน .env ของลูกค้า):");
console.log("  ----------------------------------------------------------");
console.log(licenseKey);
console.log("  ----------------------------------------------------------");
console.log(`📄 คัดลอก key นี้ไปส่งลูกค้า; สำเนาเก็บไว้ที่: ${outPath}`);
console.log("");