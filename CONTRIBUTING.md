# Contributing to Micro-Business-Suite

Thank you for your interest in contributing!

## Getting Started
1. Fork the repository and clone your fork.
2. Install dependencies: `pnpm install`
3. Copy env: `cp .env.example .env.local` and fill in `DATABASE_URL`, `NEXTAUTH_SECRET`/`AUTH_SECRET`, `LICENSE_SALT`.
4. Run migrations on your Postgres (see `migrations/`).
5. Run dev: `pnpm dev`

## Development Workflow
- Create a feature branch from `main`: `git checkout -b feat/your-feature`
- Keep commits focused and atomic.
- Run before submitting: `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`
- Do not commit secrets, `.env*`, `node_modules/`, `.next/`.

## Coding Standards
- Follow existing patterns in `lib/`, `app/api/`, `app/`.
- Tenant scoping: every query touching tenant data must filter by `company_id` from `getUserCompanyId(session.user.id)`.
- Auth: every API route must call `auth()` and return 401 if no session.
- Admin routes: check `isAdmin`/`isSuperAdmin`.
- No raw SQL string interpolation of user input — use parameterized queries.
- Secrets must never be returned to the client; expose `has_*` booleans only.

## Submitting a PR
1. Open a PR against `main` with a clear description.
2. Reference any related issue.
3. Ensure CI passes (lint, typecheck, tests).
4. Be responsive to review feedback.

## Reporting Bugs
Use GitHub Issues with the bug template. Include reproduction steps, expected vs actual, environment.

## Code of Conduct
This project follows the Contributor Covenant. See `CODE_OF_CONDUCT.md`.
