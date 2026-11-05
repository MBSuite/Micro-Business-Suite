# Integration Security Tests

## Current status

As of 2026-11-06, `pnpm test` reports 8 passing tests and 9 integration tests skipped unless `MBS_TEST_BASE_URL`, `MBS_TEST_DATABASE_URL`, and `MBS_TEST_JWT_SECRET` are set. A skipped integration test is not a pass.

## Harness safety

`tests/integration/run.mjs` uses the named Docker container `mbs-integration-pg`, database `mbs_test`, and local port `54329`. It drops a set of tables with `CASCADE` before applying `tests/integration/schema.sql`. It may start or reuse that container.

- Never point the harness or `MBS_TEST_DATABASE_URL` at Neon production or any database with data to retain.
- Before running, inspect the named container and confirm it is disposable. If its ownership or contents are unknown, stop and ask; do not reset it.
- For a fresh isolated run, use a temporary PostgreSQL container/database on an unused port, and ensure the app process receives only that test URL. Remove the temporary test resources after the run.
- Do not move or overwrite `.env.local` as a shortcut. Next.js may load it and override test environment values; the harness must isolate env loading explicitly before it is considered safe to run.
- The test assertion requires `DATABASE_URL` to differ from `MBS_TEST_DATABASE_URL`. This string comparison is not sufficient proof of isolation; verify the destination host/database too.

## Test inputs

- `MBS_TEST_BASE_URL`: URL of the app running against the test database.
- `MBS_TEST_DATABASE_URL`: disposable test database URL; local PostgreSQL typically uses `?sslmode=disable`.
- `MBS_TEST_JWT_SECRET`: test-only secret matching the secret used by the app process.

## Coverage

Tests cover unauthenticated route rejection, admin access control, superadmin diagnostics/backup, tenant isolation for payment/invoice/contact data, and omission of secrets from company API responses. Confirm the test names in `tests/integration-security.test.mjs` because coverage evolves.
