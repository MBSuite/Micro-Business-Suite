#!/usr/bin/env node
// Read-only audit of users whose company_id is missing or points at a
// non-existent company. This script never writes data.

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
import { Client } from "pg";

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) {
  console.error("DATABASE_URL or POSTGRES_URL is not set");
  process.exit(1);
}

const client = new Client({ connectionString });
await client.connect();

try {
  const { rows } = await client.query(`
    SELECT
      u.id,
      u.name,
      u.email,
      u.role,
      u.status,
      u.company_id,
      CASE
        WHEN u.company_id IS NULL THEN 'missing'
        WHEN c.id IS NULL THEN 'invalid'
        ELSE 'valid'
      END AS mapping_status
    FROM users u
    LEFT JOIN companies c ON c.id = u.company_id
    WHERE u.company_id IS NULL OR c.id IS NULL
    ORDER BY u.id
  `);

  console.log(`Unmapped/invalid company mappings: ${rows.length}`);
  for (const row of rows) {
    console.log(
      `  user_id=${row.id} email=${row.email} role=${row.role} status=${row.status} company_id=${row.company_id ?? "NULL"} status=${row.mapping_status}`
    );
  }

  if (rows.length > 0) {
    console.log("\nReview these users and assign company_id explicitly before rollout. No changes were made.");
  }
} finally {
  await client.end();
}
