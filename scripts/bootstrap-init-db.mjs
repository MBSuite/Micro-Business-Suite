/**
 * Database Bootstrap & Migration Runner
 * 
 * Purpose: Initializes database schemas and applies baseline migrations in order.
 * Safe for initial deployment and schema verification.
 * 
 * Usage: node scripts/bootstrap-init-db.mjs
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
import { readFileSync, existsSync } from "node:fs";
import { Client } from "pg";

const FILES = [
  "scripts/backup.sql",
  "scripts/init-chart-of-accounts.sql",
  "migrations/add_ai_alerts_table.sql",
  "migrations/add_google_oauth2_columns.sql",
  "migrations/add_issue_date_column.sql",
  "migrations/add_pp36_exempt_column.sql",
  "migrations/add_quotation_recurring_columns.sql",
  "migrations/fix_column_types.sql",
  "migrations/add_company_tenant_scope.sql",
  "migrations/add_payment_no_column.sql",
  "migrations/add_payment_status_column.sql",
  "migrations/add_payment_wht_amount_column.sql",
  "migrations/add_items_services_table.sql",
  "migrations/add_payroll_entries_table.sql",
  "migrations/add_services_table.sql",
  "migrations/fix_column_types_date_timestamp.sql",
];

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set in environment or .env.local");
  process.exit(1);
}

const client = new Client({ connectionString });
await client.connect();

let ok = 0;
for (const f of FILES) {
  if (!existsSync(f)) {
    console.warn(`SKIP (not found) ${f}`);
    continue;
  }
  const sql = readFileSync(f, "utf8");
  try {
    await client.query(sql);
    console.log(`OK   ${f}`);
    ok++;
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    console.error(`FAIL ${f}\n     ${errorMsg}`);
  }
}

console.log(`\nBootstrap summary: ${ok}/${FILES.length} migration files processed`);
await client.end();
process.exit(ok > 0 ? 0 : 1);
