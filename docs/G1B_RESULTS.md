# G1b — Docker Rehearsal with Real Prefixed Migrations (results)

Date: 2026-11-08
Scope: Real prefixed migrations of all 6 modules deployed serially on a shared PostgreSQL database (Docker), proving the shared-DB deploy mechanism end-to-end.
Not in scope: Neon, production data, Vercel env, deploy, auth, data import.

## Environment
- Container: `mbs-g1b-pg` (disposable, `postgres:16-alpine`, PG 16.15) — removed after rehearsal
- DB: `mbs_shared_g1b` on `127.0.0.1:55433`
- Prisma CLI: 7.10.0 (matches modules)
- Roles: `mbs_<module>_{app,migrator}` × 6 (LOGIN, password stored only in `/tmp`, not committed)
- Modules: Service, Retail, Rental, Pharmacy, Hotel, F&B (6)

## Implementation performed (prerequisite for G1b)
- Updated each module's `prisma/schema.prisma`: enum `@@map` to `mbs_<module>_<enum>`, table `@@map` to `mbs_<module>_<table>`, index `map:` names prefixed.
- Regenerated each module's migration as a single prefixed init migration folder `mbs_<module>_0_init` (Prisma `migrate diff --from-empty`), removing the `CREATE SCHEMA IF NOT EXISTS "public"` line so least-privilege migrator roles (no CREATE on database) can apply it.
- Regenerated Prisma client in each module (`prisma generate`) — all succeeded.
- Removed old unprefixed migration folders (backed up under `/tmp/opencode/migrations-backup`).

## Matrix results

| # | Scenario | Result |
|---|---|---|
| G1b-T1 | clean shared DB → deploy Service (first module, creates `_prisma_migrations`) | PASS — ledger created by `mbs_service_migrator`, 1 row |
| G1b-T2 | grant ledger DML to other migrators, then deploy Retail/Rental/Pharmacy/Hotel/F&B serially | PASS — 6 rows total, no checksum error |
| G1b-T3 | redeploy Service + Retail (idempotent) | PASS — "No pending migrations to apply", no duplicate rows |
| G1b-T4 | `prisma migrate status` (Service) | PASS — "Database schema is up to date!"; caveat: does not detect drift (same as G1) |
| G1b-T5 | app role isolation (service app): CRUD own table OK; denied on `_prisma_migrations`; denied on other module's table; denied DDL on schema | PASS |
| G1b-T6 | Prisma client smoke (service app): create/count/delete on prefixed table | PASS |
| G1b-T7 | ledger contents | PASS — 6 migration rows, all `finished_at` set |
| G1b-T8 | concurrent deploy / failed migration / name collision | NOT re-tested in G1b (covered by G1 T8–T10); runbook rules unchanged |

## Findings
1. **`CREATE SCHEMA IF NOT EXISTS "public"` must be removed** from generated migrations when migrator lacks CREATE on database (least privilege). Public schema always exists in a created database.
2. **Ledger bootstrap sequence confirmed** with real migrations: deploy first designated module → grant ledger DML → deploy rest serially. No parallel deploy.
3. **App roles require explicit per-table grants** (ownership by migrator grants nothing to app). Verified.
4. **Name uniqueness**: all 6 migration folders are `mbs_<module>_0_init` — globally unique. No collision.
5. **No raw SQL in module code** references table names (only `SELECT 1` health check), so prefixing `@@map` alone keeps app code working; Prisma client smoke passed.

## Not proven by G1b (requires later gates)
- Incremental migration history (single init migration used; production data migration uses rename/import scripts per §2.6.1/§2.6.2, not `migrate deploy` increments).
- Neon behaviour (pooled vs direct, advisory lock, branch) → G2.
- Production PostgreSQL version → G3.
- Data import / enum compatibility / store_settings tenant scope → G3/G4.
- Auth (per-app login, no SSO) → separate approval (§6.4).

## Cleanup
- Container `mbs-g1b-pg` removed; anonymous volumes removed.
- No production/Neon/env access. No commit/push performed by this rehearsal.

## Status
G1b PASSED for the shared-DB deploy mechanism with real prefixed migrations. Ready for owner approval of G2 (Neon rehearsal) per §6.2.
