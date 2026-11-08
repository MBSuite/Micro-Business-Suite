# Production Migration — Shared DB (results)

Date: 2026-11-08
Target: production DB `ep-delicate-base-b31rx7ol` (micro-business-suite), as designated by owner.
Scope: Create module-prefixed tables + roles + grants on the shared production DB. No Core data modified.

## What was done
1. Created 12 roles (`mbs_<module>_{app,migrator}` × 6) with CONNECT on `neondb` and schema `public` USAGE/CREATE (migrator only).
2. Created `_prisma_migrations` ledger manually (Prisma DDL) as `mbs_service_migrator`.
3. Granted ledger DML to other migrators.
4. Ran each module's prefixed migration SQL (`mbs_<module>_0_init`) manually as its migrator role → created 60 prefixed tables + enums.
5. Recorded all 6 migrations as applied via `prisma migrate resolve --applied`.
6. Granted app roles SELECT/INSERT/UPDATE/DELETE on their own prefixed tables + USAGE on their enums (issued by each table owner = migrator).

## Verification
- `_prisma_migrations`: 6 rows, all `finished_at` set.
- Prefixed tables: 60 (Service 9, Retail 9, Rental 12, Pharmacy 11, Hotel 11, F&B 8).
- Core row counts unchanged: companies 3, users 3, company_settings 4, services 4, chart_of_accounts 36.
- App-role isolation verified (service app): CRUD own table OK; denied ledger; denied other module's table; denied DDL.
- Prisma client smoke (service app) on production: create/count/delete OK.

## Credentials
- Role passwords (rehearsal+production) stored in `/tmp/opencode/prod_roles_pass.txt` (mode 600, NOT committed). Owner should move to Vercel/secret manager and rotate.
- Direct (non-pooled) host used for migrations: `ep-delicate-base-b31rx7ol.c-4.ap-southeast-1.aws.neon.tech`.

## Not done (still pending, owner-driven)
- Update each module's Vercel `DATABASE_URL` to the shared DB (direct for migrate, pooled for runtime) + `MBS_COMPANY_ID` mapping decision (§3.4).
- `store_settings` tenant scope migration (§3.7) — additive, needs approval.
- Auth/SSO (§3.6/§6.4).
- Data import from old module DBs (if any real data exists) per §2.6.1.
- Rotate role passwords + remove test keys (owner).

## Status
Production shared-DB schema + roles + grants: **DONE**. Core data untouched.
