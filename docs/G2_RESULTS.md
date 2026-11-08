# G2 — Neon Rehearsal (results)

Date: 2026-11-08
Target: `G2_DIRECT_URL` (`ep-young-king-a1n3x2ud`, Neon, direct/non-pooled) — disposable rehearsal DB, separate from production (`ep-delicate-base-b31rx7ol`).
Scope: Deploy all 6 modules' prefixed migrations on Neon; verify Neon-specific behaviour (PG version, pooled vs direct, advisory lock) and app-role isolation.
Not in scope: production data, Vercel env, deploy, auth/SSO, data import.

## Environment
- Neon project: `ep-young-king-a1n3x2ud` (ap-southeast-1), DB `neondb`
- PostgreSQL: 18.6 (aarch64) — newer than Docker fixture (16.15)
- Prisma CLI: 7.10.0
- Modules: all 6

## Pre-flight (read-only metadata, §6.2)
- Connected as `neondb_owner`; confirmed target is a separate Neon project from production.
- `public` schema already contained a partial prior state: Service module only (1 migration, empty tables) + roles. `neon_auth` schema present (Neon-managed; untouched).
- No production data present (all module tables 0 rows). Decision: deploy remaining 5 modules on top (does not require destructive `DROP SCHEMA`); validates incremental module addition to an existing ledger.

## Matrix results

| # | Scenario | Result |
|---|---|---|
| G2-T1 | Deploy Retail/Rental/Pharmacy/Hotel/F&B serially on existing ledger (Service already applied) | PASS — 6 migrations total, all `finished_at` set |
| G2-T2 | `migrate status` (Service) | PASS — "Database schema is up to date!" |
| G2-T3 | idempotent redeploy (Service) | PASS — "No pending migrations to apply" |
| G2-T4 | app role isolation (service app): CRUD own table OK; denied on `_prisma_migrations`; denied on other module's table; denied DDL | PASS |
| G2-T5 | Prisma client smoke (service app) on Neon | PASS (created/count/deleted on prefixed table; SSL mode warning non-fatal) |
| G2-T6 | ledger contents | PASS — 6 rows, all applied |

## Neon-specific findings
1. **PG version differs (18.6 vs fixture 16.15).** Migrations applied cleanly; `gen_random_uuid()` available built-in. No version-specific failures observed in this rehearsal.
2. **Direct (non-pooled) URL is required** for `migrate deploy` (advisory locks). `G2_DIRECT_URL` is non-pooled and worked. Pooled URL must not be used for migrations.
3. **Role ownership differs from Docker.** On Neon, tables were owned by `neondb_owner` (because deploy ran as DB owner) except Service (owned by `mbs_service_migrator` from prior setup). Grants therefore must be issued by the actual table owner (or ownership normalized). In production, standardize ownership to migrator roles for least privilege (follow §4.4).
4. **`neon_auth` schema coexists** in `public`'s database — must be preserved; do not `DROP SCHEMA public CASCADE` blindly (would not drop `neon_auth`, but any extension objects in `public` would be lost). Prefer creating a dedicated empty DB or project for rehearsal.
5. **SSL mode warning** from node/pg about `sslmode=require` vs `verify-full` — non-fatal; align SSL params in production.

## Not proven by G2 (requires later gates)
- Production source inventory / row counts / company mapping → G3
- Env change + deploy + data import → G4
- Auth/SSO → separate approval (§6.4)
- Concurrent deploy race / failed-migration recovery on Neon (covered by G1 T9/T10 on Docker; behaviour expected identical)

## Cleanup
- No destructive changes to production (`ep-delicate-base-b31rx7ol` untouched).
- Target DB retains the 6-module rehearsal schema + roles (available for G3/G4 follow-up). Passwords reset to a rehearsal-only value; not committed.

## Status
G2 PASSED for the Neon deploy mechanism with real prefixed migrations. Ready for owner approval of G3 (production source inventory, read-only) per §6.3.
