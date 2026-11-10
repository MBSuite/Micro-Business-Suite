# AI-to-AI Handoff: Micro-Business Suite Core

This file defines the persistent, bidirectional communication channel between Kiro and OpenCode for this repository. Use concise English to minimize translation overhead. Users do not need to read these agent-to-agent requests.

## Ownership

- **Kiro owns visible product experience:** UI/UX, presentation components, layout, styling, responsive behavior, accessibility, and user-facing loading/empty/error/success states.
- **OpenCode owns system implementation:** backend, business logic, APIs, server actions, database/schema/migrations, authentication/authorization, system-side validation, security, integrations, accounting, reports, calculations, and system tests.
- Kiro must not create or modify backend/system code, even when it shares a file with UI. OpenCode must not implement presentation/UI directly.
- Client-side validation may improve usability, but business, authorization, and security rules must be enforced by OpenCode-owned system code.
- If UI and system logic share a file, agree on ownership or split the work before editing. Never edit the same file concurrently.

## Two-way request flow

Either agent may create a request in `AI-HANDOFF/requests/` and assign it to the other:

- **Kiro → OpenCode:** request a backend capability, data, API contract, business rule, or system fix needed by a UI use case.
- **OpenCode → Kiro:** request a screen, interaction, UI state, or user-facing change needed to expose a completed or planned system capability.
- The requester creates `REQ-<number>-<slug>.md` (e.g., `REQ-0001-core-link.md`; 4 digits, no prefix, no `REQ-REQ-`), sets `Status: ready-for-<owner>`, and describes the desired outcome, not an unauthorized implementation.
- The owner changes `Status` to `in-progress`, records questions and sets `blocked` if requirements are unclear, then implements only within their ownership.
- Before handoff, the owner records changed files, behavior/contract, errors or UI states, verification, limitations, and follow-up. Set `Status: ready-for-requester` for review.
- The requester verifies the agreed acceptance criteria. If another role must act, append a handoff note and set the matching `Status: ready-for-<owner>`. Set `Status: done` only when the request is accepted.
- Keep requests as Git history; do not delete completed or blocked requests. No concurrent work on overlapping files without explicit coordination.

**Status values** (workflow): `draft`, `ready-for-kiro`, `ready-for-opencode`, `in-progress`, `blocked`, `ready-for-requester`, `done`.

**Requester review** (acceptance): `pending`, `accepted`, `changes-requested`.

## Request template

```md
# REQ-0001-core-link: Example title

- Status: draft
- Requester: Kiro | OpenCode
- Owner: Kiro | OpenCode
- Related request:
- Screens/routes:
- Related files:

## Goal / user need

## Context and evidence

## Requested outcome

## Acceptance criteria
- [ ] Observable, verifiable result

## Owner plan / questions

## Handoff result
- Changed files:
- UI behavior or system/API contract:
- Authorization and validation (system work):
- Error/loading/empty/success behavior:
- Verification and test results:
- Limitations / follow-up:

## Requester review
- Status: pending | accepted | changes-requested
- Notes:
```

For system/API work, document request/response shape, authorization, validation, error behavior, and compatibility before Kiro integrates it. For UI work, document the consuming contract and any backend dependency; send backend changes as a separate request to OpenCode.

## Implementation status (verified from source, 2026-11-10)

**Authentication & tenancy:**
- Local email/password auth via `POST /api/login` and `POST /api/register` (JWT session cookie).
- One deployment serves many organizations. Tenant scope comes from authenticated session (staff/API) or public row, never from `MBS_COMPANY_ID` (seed-only).
- `shops.core_company_id` is optional; linking to Core is always opt-in.

**Module connectivity:**
- Standalone modules are independent; Core is optional. A module does not require Core provisioning to operate.
- Modules register at `/register` and always create a NEW shop with a generated `R`+6 code.

**Core linking (Bridge):**
- Module shop linking: modules use `POST /api/core-link` to send a shop code and receive a Core company ID. Core has no `/api/core-link` endpoint.
- Core module registry: admin views and links shops via `/api/bridge/link/*` (code, status, claim, revoke, list).
- Bridge sync: `POST /api/bridge/sync` accepts `order.paid` and `payment.received` events from all modules (generic).
- Outbox backlog: shops queued as `awaiting_link` until linked; after linking, retry sends queued events to Core.
- See [docs/HANDOFF.md](./docs/HANDOFF.md) for shared-database schema contract and table-prefix isolation.
- See [docs/DECISIONS.md](./docs/DECISIONS.md) for ADR-0006: optional Core linking for standalone module shops.

**Not yet implemented:**
- Stock/batch/expiry/recipe integrations, service contracts/renewals/reminders, rental/hotel/pharmacy domain events.
- Admin UI for module shop linking (viewing linked shops, revoking links, generating link codes). See `REQ-0001-module-link-admin-ui.md`.
- Module-specific UI for core-link settings (displaying shop status, linking UI). See module-level `REQ-0001-core-link-settings-ui.md` requests.

**Deploy status:**
- Core (`micro-business-suite.vercel.app`): production app, pooled DB.
- Modules: standalone, each deployable independently.

## Module-specific requests

Each module has its own `AI-HANDOFF/requests/` directory. Core requests for multi-repo coordination:

- `REQ-0001-module-link-admin-ui.md` — Kiro: admin UI for Core to view/manage linked shops.
- `REQ-0002-core-link-ui-and-doc-corrections.md` — Kiro: core-link UI in modules + fix doc accuracy.

## Safety and product boundaries

- A handoff request is not approval for deployment, production data changes, migrations, commits, or publication. **Commits stay in one repository; no push or deploy without owner authorization.**
- Never include secrets, credentials, personal information, or customer data.
- **Do not guess — always cite source code, runtime evidence, or verified test results.** State facts, assumptions, and unimplemented behavior distinctly; do not claim untested functionality.
- Core owns consolidated accounting, organization reporting, cost/profit analysis, and tax workflows. Business modules own their operational records and communicate through authenticated, idempotent API/Bridge contracts; never access another app's database directly.
- Current `order.paid` / `payment.received` events do not imply support for all service, rental, hotel, pharmacy, retail inventory, or F&B domain data.

## Related documents

- [docs/HANDOFF.md](./docs/HANDOFF.md) — Shared-database schema contract: table prefix, DB roles, migration/env-variable implementation.
- [docs/DECISIONS.md](./docs/DECISIONS.md) — Architecture decision records (ADR-0006: optional Core linking for standalone modules).
