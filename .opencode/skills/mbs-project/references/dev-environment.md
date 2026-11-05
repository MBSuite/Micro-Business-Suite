# Development Environment and Database Safety

## Project boundaries

- This repository is the Micro-Business-Suite Next.js application.
- `MBSuite.Dev` is a separate website/repository in the sibling directory `../MBSuite.Dev`. Do not copy it into this repository, include it in builds, or edit it as part of MBSuite work.

## Database target

- `lib/db.ts` uses `POSTGRES_URL` or `DATABASE_URL`; `.env.local` may target a real Neon branch and is not automatically a test database.
- Before running local actions, seed scripts, bootstrap, or migrations, verify the selected Neon project and branch without printing the connection string. Never assume a command is safe because it runs locally.
- Use a disposable Neon branch for schema/test work. Use a pooled Neon URL for application traffic and a direct, non-pooled URL for migrations.
- Docker Compose runs only the app and requires a Neon `DATABASE_URL`:
  `docker compose --env-file .env.local up -d --build`
- Review and back up before any production schema change; obtain explicit owner approval before applying it.

## Local development

- Check that the selected port is available before starting the dev server; use the repository's configured `pnpm dev` command or `pnpm exec next dev -p <available-port>`.
- Load the intended environment deliberately. Do not copy or print `.env.local` contents in logs, chat, or commits.
- For a local PostgreSQL test database without TLS, its test URL needs `?sslmode=disable`; Neon connections should use TLS.

## Scripts

| Command | Purpose and safety |
|---|---|
| `pnpm test` | Unit tests; integration cases skip unless their isolated test variables are supplied |
| `pnpm test:integration` | Starts the integration harness. See `integration-harness.md`; it resets tables and must use only disposable test data |
| `pnpm build` | Production build and TypeScript validation |
| `pnpm lint` | ESLint |
| `node scripts/bootstrap-init-db.mjs` | Applies the configured bootstrap SQL/migrations; target is `.env.local`'s `DATABASE_URL`, so use only a reviewed disposable branch unless production application is explicitly approved |
| `node scripts/check-column-types.mjs` | Schema inspection; verify its configured database target before running |
| `pnpm license:issue -- --mode perpetual --company "X" --licensee user@example.com --max-users 5` | Issue a license; review `scripts/issue-license.mjs` for options |

## Admin credentials

Use [mbs-admin-access](../../mbs-admin-access/SKILL.md) for credential discovery or reset. A password reset modifies the selected database and requires explicit owner approval after verifying its Neon branch. Never print passwords, hashes, tokens, or connection strings.
