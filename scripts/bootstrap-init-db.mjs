/**
 * Database Bootstrap & Migration Runner
 * 
 * Purpose: Initializes database schemas and applies baseline migrations in order.
 * Safe for initial deployment and schema verification.
 * - If tables already exist (existing DB like Neon), skips backup.sql
 * - Continues on non-fatal errors (idempotent migrations)
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
  "migrations/add_companies_table.sql",
  "migrations/add_users_company_id_column.sql",
  "migrations/add_company_settings_table.sql",
  "migrations/add_company_module_settings_table.sql",
  "migrations/add_contacts_contact_type_column.sql",
  "migrations/add_expenses_columns.sql",
  "migrations/add_payments_invoices_columns.sql",
  "migrations/add_recurring_billing_schema.sql",
  "migrations/add_company_tenant_scope.sql",
  "migrations/add_company_tenant_scope_quotations_expenses.sql",
  "migrations/add_company_tenant_scope_payment_vouchers.sql",
  "migrations/add_payment_no_column.sql",
  "migrations/add_payment_status_column.sql",
  "migrations/add_payment_wht_amount_column.sql",
  "migrations/add_items_services_table.sql",
  "migrations/add_payroll_entries_table.sql",
  "migrations/add_services_table.sql",
  "migrations/add_company_tenant_scope_master_tables.sql",
  // migrations/fix_column_types_date_timestamp.sql is intentionally NOT run by the
  // bootstrap runner: it changes existing column types and requires manual review.
  // Verify current types first with: node scripts/check-column-types.mjs
];

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set in environment or .env.local");
  process.exit(1);
}

const client = new Client({ connectionString });
await client.connect();

// Detect if this is an existing database (skip backup.sql)
const { rows: existingTables } = await client.query(`
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='users'
  ) as has_users,
  EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='companies'
  ) as has_companies
`);
const isExistingDb = existingTables[0]?.has_users || existingTables[0]?.has_companies;

if (isExistingDb) {
  console.log("Existing database detected (users/companies exist) - will skip scripts/backup.sql");
}

let ok = 0;
let skipped = 0;
let failed = 0;

for (const f of FILES) {
  if (!existsSync(f)) {
    console.warn(`SKIP (not found) ${f}`);
    skipped++;
    continue;
  }
  
  // Skip backup.sql on existing databases
  if (isExistingDb && f === "scripts/backup.sql") {
    console.log(`SKIP  ${f} (existing database)`);
    skipped++;
    continue;
  }
  
  const sql = readFileSync(f, "utf8");
  try {
    await client.query(sql);
    console.log(`OK   ${f}`);
    ok++;
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    // Don't fail on "already exists" type errors
    if (errorMsg.includes("already exists") || errorMsg.includes("duplicate")) {
      console.log(`SKIP ${f} (already applied)\n     ${errorMsg.split('\n')[0]}`);
      skipped++;
    } else {
      console.error(`FAIL ${f}\n     ${errorMsg.split('\n')[0]}`);
      failed++;
    }
  }
}

console.log(`\nBootstrap summary: ${ok} ok, ${skipped} skipped, ${failed} failed / ${FILES.length} total`);
await client.end();
process.exit(failed > 0 ? 1 : 0);
