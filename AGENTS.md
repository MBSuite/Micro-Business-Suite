<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Product and integration boundaries

- **MB** means Micro Business / SME; **Suite** is a set of business-specific applications customers can select by business need.
- This repository is the **Core**: central accounting, monthly reporting, revenue/cost/profit-and-loss analysis, inventory overview, and tax workflows for organizations with branches or franchises.
- The six sibling applications are standalone operational modules for smaller businesses. Do not make Core a runtime dependency for a module to sell, serve customers, book a stay, or record its source transaction.
- A module owns its detailed operational records; Core owns the consolidated books, organization-level reports, and tax workflow. Avoid duplicate journal entries and define each inbound event's accounting treatment before implementing it.
- Integrate only through authenticated APIs/Bridge contracts, never by directly reading or writing a module's database. Preserve source IDs, company and branch mapping, event time, currency, and idempotency; make duplicate/retried events safe and visible.
- Standalone modules currently send the generic `order.paid` event; the Core validator also recognizes `payment.received`. Do not claim that booking, rental, service-contract, pharmacy-stock, inventory-cost, or other domain events are supported until their contracts and end-to-end tests exist.
- Treat product intent and current code as separate facts. Update README status when a workflow is implemented and tested; do not document scaffold routes as a completed business feature.

## Owner-designated sample companies

The owner identified these Core database records as sample-company references for ongoing planning and testing:
- Company ID `1`: `Your Company`
- Company ID `2`: `innovation`
- Company ID `3`: `บริษัท ทดสอบ จำกัด`

Use these as test identities without asking the owner again unless the records are unavailable or have changed. They are not confirmed production mappings for any module. Do not write test data to a retained/live database; use an isolated disposable test database for write tests, and do not copy additional customer or contact data into this repository.

---

## AI-to-AI handoff

- Follow the bidirectional English communication protocol in [AI-HANDOFF.md](./AI-HANDOFF.md).
- Either Kiro or OpenCode may create and assign a request to the other. Kiro owns visible UI; OpenCode owns all backend/system logic.
- Use `AI-HANDOFF/requests/REQ-<id>.md`, set `ready-for-<owner>`, and record acceptance criteria, outcome, and verification. Do not assume one fixed sender/receiver direction.
- Never let Kiro modify backend/system code or OpenCode implement presentation/UI. Coordinate shared-file ownership before edits; no concurrent edits to the same file.
- For backend-to-UI handoff, OpenCode must document the contract and set `ready-for-kiro`; for UI-to-backend requests, Kiro must document the user need and set `ready-for-opencode`.

## กฎการบันทึกรายงาน (Report Destination — ตรงข้อเท็จจริง)

- **บันทึกการตัดสินใจ / รายงานงาน:** `docs/DECISIONS.md` (มีจริงใน repo นี้)
- **ไม่ใช้ path ที่ไม่มีจริง:** `DESK/NOW.md`, `MEMORY/DECISIONS.md`, `KNOWLEDGE/MBSUITE/` — ไม่ปรากฏใน repo นี้ (ตรวจสอบ 28 ต.ค. 2569)
- **ก่อนแก้ไข/ย้ายข้อมูลสำคัญ:** ตรวจ `README.md` + `git remote` + `git log` ก่อนเสมอ (ตาม workspace rules)
- **ห้ามเดา** — ยืนยันด้วย `ls` / `read` ก่อนเขียนเอกสารอ้างอิง
- **ไม่ทำโค้ด MBSuite แยกจาก repo นี้** — งาน dev อยู่ที่ repo นี้ (`Micro-Business-Suite`) ไม่ใช่ `01-PRODUCTS-BUSINESS/Micro-Business-Suite` (path นั้นไม่มีจริง; มีแค่ `Micro-Business-Suite-full`)

## Project boundaries and database safety

- `MBSuite.Dev` is a separate website/repository at `../MBSuite.Dev`; do not copy, move, nest, or build it as part of this Next.js repository.
- This app connects through `lib/db.ts` using `POSTGRES_URL` or `DATABASE_URL`. Verify which Neon branch a local `.env.local` targets before running any write, seed, bootstrap, or migration command; never assume a local command targets a disposable database.
- Docker Compose runs only the app and requires a Neon `DATABASE_URL`. Use `docker compose --env-file .env.local ...`; the app URL should be Neon pooled. Do not add a local PostgreSQL service unless the owner explicitly changes this architecture.
- For shared module schema work, first validate all module migrations and isolation against a disposable local Docker PostgreSQL database. Then test the approved migration path on a disposable Neon branch with a direct URL. Back up and obtain explicit owner approval before any production migration. Keep production runtime pooled URLs separate from migration URLs.
- Before shared-database work in Core or any module, follow the concrete table-prefix, DB-role, migration, and env-variable implementation contract in [docs/HANDOFF.md](./docs/HANDOFF.md). The contract does not authorize Production env changes, migrations, data movement, or deployment.
- `tests/integration/run.mjs` resets tables in the named `mbs-integration-pg` container. Never point it at Neon or a database containing data to retain; use only a disposable isolated test database.

## Module migration runbook

- Canonical procedure: [docs/MODULE_MIGRATION_RUNBOOK.md](./docs/MODULE_MIGRATION_RUNBOOK.md).
- Ownership invariant: every `mbs_<module>_*` table is owned by `mbs_<module>_migrator`. Run DDL as that role (`SET LOCAL ROLE`), never as the database owner.
- A failed migration is not a migration to resolve: stop, capture the exact error, inspect partial DDL, report to the owner. Never run `prisma migrate resolve` on your own.
- A newly created table needs an explicit `GRANT ... TO mbs_<module>_app`. Migrations do not inherit the database owner's default privileges.

## Owner standing authorization (2026-11-11)

Pre-approved by the owner — these do not require a new approval each time:

- Read-only inspection of any environment: health endpoints, `pg_catalog` queries, `prisma migrate status`.
- Applying module migrations to the **Dev** database (Neon) as the module migrator role, following the runbook above.
- Disposable local Docker / Neon test databases, including resetting them for tests.
- Fixing a defect directly when the fix is small and verifiable, instead of adding another report round.

Still require explicit owner approval every time: Supabase (Production) migrations or data changes, Vercel / environment-variable changes, deploy, `git push`, and any irreversible destructive operation (drop table/schema, truncate, delete data, force push). These guardrails kept the 2026-11-11 migration incident on Dev and non-destructive; do not remove them.

## Deployed URLs

- **Micro-Business-Suite** (`/home/neon13/workspace/services/next/00-MAIN-WEB/Micro-Business-Suite`) = https://micro-business-suite.vercel.app/ — โปรแกรม (production app)
- **MBSuite.Dev** (`/home/neon13/workspace/services/next/00-MAIN-WEB/MBSuite.Dev`) = https://mb-suite-dev-pi.vercel.app/ — เอกสาร + เนื้อหา + โบชัว + โปรโมชั่น