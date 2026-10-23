/**
 * Column Type Check (read-only)
 *
 * Purpose: Reports the current data types of the columns that
 * migrations/fix_column_types_date_timestamp.sql would alter.
 * This script never changes schema or data — it only inspects information_schema.
 *
 * Usage: node scripts/check-column-types.mjs
 * Exit code: 0 = all columns already correct, 1 = at least one column still needs
 *            manual review, 2 = could not connect or query.
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
import { Client } from "pg";

const TARGETS = [
  { table: "expenses", column: "expense_date", expected: "date" },
  { table: "invoices", column: "created_at", expected: "timestamp without time zone" },
  { table: "payment_vouchers", column: "issue_date", expected: "date" },
];

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set (expected in .env.local or environment).");
  process.exit(2);
}

const client = new Client({ connectionString });
await client.connect();

let needsAttention = 0;
let missing = 0;

for (const { table, column, expected } of TARGETS) {
  const { rows } = await client.query(
    `
      SELECT data_type, udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
    `,
    [table, column]
  );

  if (rows.length === 0) {
    missing++;
    console.log(`MISSING  ${table}.${column} (column not found)`);
    continue;
  }

  const { data_type: dataType, udt_name: udtName } = rows[0];
  const isExpected = dataType === expected;
  if (!isExpected) needsAttention++;
  console.log(
    `${isExpected ? "OK      " : "REVIEW  "} ${table}.${column} = ${dataType} (${udtName}); expected ${expected}`
  );
}

console.log(
  `\nSummary: ${TARGETS.length - needsAttention - missing}/${TARGETS.length} columns match, ` +
    `${needsAttention} need review, ${missing} missing.`
);
if (needsAttention > 0 || missing > 0) {
  console.log(
    "No changes were made. Do not run migrations/fix_column_types_date_timestamp.sql until the impact is reviewed and approved."
  );
}

await client.end();
process.exit(needsAttention > 0 || missing > 0 ? 1 : 0);
