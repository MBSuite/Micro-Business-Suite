#!/usr/bin/env node
// Production backup script (READ-ONLY — runs pg_dump against the configured DB URL)
// Usage:
//   node scripts/backup-prod.mjs                 # uses DATABASE_URL (or POSTGRES_URL)
//   node scripts/backup-prod.mjs --unpooled       # prefers POSTGRES_URL_NON_POOLING / DATABASE_URL_UNPOOLED
//   node scripts/backup-prod.mjs --out ./backups  # custom output dir
//
// WARNING: This script READS from the database only. It does not write or migrate.
// Always verify the target URL (Neon branch) before running.

import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const useUnpooled = args.includes("--unpooled");
const outIdx = args.indexOf("--out");
const outDir = outIdx !== -1 ? args[outIdx + 1] : "./backups";

// Load .env.local if present
try { require("dotenv").config({ path: ".env.local" }); } catch {}

const url =
  (useUnpooled && (process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL_UNPOOLED)) ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL;

if (!url) {
  console.error("❌ No database URL found. Set POSTGRES_URL or DATABASE_URL in .env.local");
  process.exit(1);
}

// Safety: refuse pooled URL for unpooled mode
if (useUnpooled && url.includes("-pooler.")) {
  console.error("❌ --unpooled requested but URL looks pooled (-pooler.). Use a direct/unpooled URL.");
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outFile = resolve(outDir, `mbs-backup-${stamp}.dump`);
const redacted = url.replace(/:\/\/[^@]+@/, "://[redacted]@");
console.log(`[backup] target: ${redacted}`);
console.log(`[backup] output: ${outFile}`);

const r = spawnSync("pg_dump", ["-Fc", "-f", outFile, url], { stdio: "inherit" });
if (r.status !== 0) {
  console.error(`❌ pg_dump failed (exit ${r.status})`);
  process.exit(r.status || 1);
}
console.log(`✅ Backup complete: ${outFile}`);
console.log("   Restore with: pg_restore -d <URL> " + outFile);
