# Database and Schema Changes

## Connection model

- The application uses PostgreSQL through `pg` Pool in `lib/db.ts`.
- `lib/db.ts` selects `POSTGRES_URL` before `DATABASE_URL` and requires an explicit URL; inspect the target without printing its value.
- Runtime app traffic, including Docker Compose, should use the Neon pooled URL. Schema migrations should use a direct (non-pooled) URL.
- Local `.env.local` may target a persistent Neon branch. Confirm the project and branch before every command that can write data.

## Source of truth

Do not treat this reference or an old test schema as a full representation of the live database. For each schema change, inspect:

1. The relevant SQL under `migrations/`.
2. The bootstrap order in `scripts/bootstrap-init-db.mjs`.
3. Current SQL callers/actions and their tenant predicates.
4. The intended target branch's live schema using a read-only inspection.

Never infer that a migration has run in production merely because it exists in the repository. Verify the migration result on the intended branch.

## Migration workflow

1. Review the SQL and identify data changes, locks, destructive behavior, and rerun behavior.
2. Create/use a disposable Neon branch and take a recoverable snapshot/backup before testing.
3. Use a direct URL for migrations; keep it out of app runtime configuration and logs.
4. Verify schema and application flows on the test branch.
5. Apply to production only after explicit owner approval, an agreed backup/restore plan, and a reviewed migration order.

`scripts/bootstrap-init-db.mjs` runs baseline SQL plus a list of migrations, and can clear legacy Google OAuth fields. It is not a harmless status check; never point it at production without reviewing the full list and obtaining approval.

## Tenant and authority checks

- Tenant reads/writes should derive `company_id` from the authenticated user's company context and scope SQL by that company.
- `users.role = 'superadmin'` is the authoritative superadmin source; legacy group membership must not grant superadmin.
- Confirm actual schema and constraints from the relevant migration and live target branch before changing application SQL.
