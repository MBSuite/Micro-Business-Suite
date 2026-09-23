/**
 * Admin User & Default Organization Bootstrap Seed
 * 
 * Purpose: Seeds the initial superadmin user and default company organization safely.
 * Security Rules:
 *  - Password is never printed to logs or standard output.
 *  - Reads password from ADMIN_SEED_PASSWORD environment variable if provided,
 *    or generates a cryptographically secure random password saved to a local file (mode 0600).
 * 
 * Usage: node scripts/bootstrap-seed-admin.mjs
 */

import { config } from "dotenv";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

config({ path: ".env.local" });

const { query } = await import("../lib/db.ts");

const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL || "admin@mbsuite.app";
const ADMIN_NAME = process.env.ADMIN_SEED_NAME || "Administrator";
const PLAN = {
  plan_type: "PROFESSIONAL",
  max_users: 5,
  subscription_status: "Active",
  expiry_date: "2027-12-31T23:59:59.999Z",
};

// Check if admin already exists
const existing = await query(`SELECT id FROM users WHERE email = $1`, [ADMIN_EMAIL]);
if (existing.rows.length > 0) {
  console.log(`[BOOTSTRAP] Admin user already exists (id: ${existing.rows[0].id}). Skipping seed.`);
  process.exit(0);
}

// Securely acquire password without leaking to stdout
let password = process.env.ADMIN_SEED_PASSWORD;
let passwordFileWritten = null;

if (!password) {
  password = crypto.randomBytes(16).toString("hex");
  const secureDir = path.join(process.cwd(), ".secure");
  if (!fs.existsSync(secureDir)) {
    fs.mkdirSync(secureDir, { recursive: true, mode: 0o700 });
  }
  const passwordFile = path.join(secureDir, "initial-admin-credential.txt");
  fs.writeFileSync(passwordFile, `EMAIL=${ADMIN_EMAIL}\nPASSWORD=${password}\n`, { mode: 0o600 });
  passwordFileWritten = passwordFile;
}

const passwordHash = await bcrypt.hash(password, 10);

// Ensure default company exists
const settingsRes = await query(`SELECT name FROM company_settings LIMIT 1`).catch(() => ({ rows: [] }));
const companyName = settingsRes.rows[0]?.name || "Your Company";

let companyRes = await query(`SELECT id FROM companies ORDER BY id ASC LIMIT 1`);
let companyId;
if (companyRes.rows.length === 0) {
  const ins = await query(
    `INSERT INTO companies (name, plan_type, max_users, subscription_status, expiry_date)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [companyName, PLAN.plan_type, PLAN.max_users, PLAN.subscription_status, PLAN.expiry_date]
  );
  companyId = ins.rows[0].id;
  console.log(`[BOOTSTRAP] Created default organization (id: ${companyId})`);
} else {
  companyId = companyRes.rows[0].id;
  console.log(`[BOOTSTRAP] Using existing organization (id: ${companyId})`);
}

// Insert initial superadmin user
const ins = await query(
  `INSERT INTO users (name, email, password, role, status, company_id)
   VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, role, status`,
  [ADMIN_NAME, ADMIN_EMAIL, passwordHash, "superadmin", "Active", companyId]
);

console.log(`[BOOTSTRAP] Successfully seeded superadmin user:`);
console.log(` - ID: ${ins.rows[0].id}`);
console.log(` - Email: ${ins.rows[0].email}`);
console.log(` - Role: ${ins.rows[0].role}`);
console.log(` - Status: ${ins.rows[0].status}`);

if (passwordFileWritten) {
  console.log(`[SECURITY] Temporary credentials saved to ${passwordFileWritten} (file permission 0600, do not commit).`);
} else {
  console.log(`[SECURITY] Admin password set from ADMIN_SEED_PASSWORD environment variable.`);
}
