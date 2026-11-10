# AI-to-AI Handoff: Micro-Business Suite Core

This file defines the persistent, bidirectional communication channel between Kiro and OpenCode for this repository. Use concise English to minimize translation overhead. Users do not need to read these agent-to-agent requests.

## Ownership

- **Kiro owns visible product experience:** UI/UX, presentation components, layout, styling, responsive behavior, accessibility, and user-facing loading/empty/error/success states.
- **OpenCode owns system implementation:** backend, business logic, APIs, server actions, database/schema/migrations, authentication/authorization, system-side validation, security, integrations, accounting, reports, calculations, and system tests.
- Kiro must not create or modify backend/system code, even when it shares a file with UI. OpenCode must not implement presentation/UI directly.
- Client-side validation may improve usability, but business, authorization, and security rules must be enforced by OpenCode-owned system code.
- If UI and system logic share a file, agree on ownership or split the work before editing. Never edit the same file concurrently.

## Implementation status (verified from source, 2026-11-10)

Use this as the shared baseline before creating a request. Do not assume unimplemented features exist.

- **Auth and tenancy:** local credentials with admin/superadmin sessions; there is no SSO. Company scope comes from the session, never from env. A module's `core_user_id` is retained as link/history data only.
- **Standalone modules:** Retail, Rental, Pharmacy, Hotel, F&B, and Service are separate repositories and must sell and operate without Core. Core must not become a runtime dependency for a module sale.
- **Module linking (ADR-0006, implemented, not deployed):** a Core admin creates a one-time 8-character code for one `(module, company)`; it expires in 15 minutes and is single-use. A module admin claims it, and Core stores only the SHA-256 hash. One Core company may hold one active shop per module; revoking keeps history and allows relinking.
  - Routes: `POST /api/bridge/link/code`, `POST /api/bridge/link/claim`, `POST /api/bridge/link/revoke`, `GET /api/bridge/link/status`, `GET /api/bridge/link/list`.
  - Code: `lib/module-links.ts`; schema: `migrations/add_module_links.sql`.
- **Bridge intake:** `POST /api/bridge/sync` accepts `order.paid` and `payment.received`, is service-token authenticated, and is idempotent per key. Only `success` rows short-circuit a retry; `failed` rows are removed so the same key can be retried.
- **Not implemented:** domain-specific events (booking, rental, hotel stay, pharmacy stock, retail inventory, service contract) and the Core link administration screen (backend ready, UI pending Kiro).
- **Deployment:** nothing here is deployed. Production migrations and deploys require explicit owner approval.

## Related documents

- `docs/HANDOFF.md` — shared-database implementation contract (table prefixes, DB roles, migrations, env vars). This file does not replace it.
- `docs/DECISIONS.md` — decision log, including the ADR-0006 module-linking decision.

## Two-way request flow

Either agent may create a request in `AI-HANDOFF/requests/` and assign it to the other:

- **Kiro → OpenCode:** request a backend capability, data, API contract, business rule, or system fix needed by a UI use case.
- **OpenCode → Kiro:** request a screen, interaction, UI state, or user-facing change needed to expose a completed or planned system capability.
- The requester creates `REQ-<number>-<slug>.md` and sets `Status: ready-for-<owner>`. `<number>` is a 4-digit sequence with no `REQ-` prefix (for example `REQ-0002-core-link-settings-ui.md`), and the title is `# REQ-<number>: <short title>`. Never write `REQ-REQ-`. Describe the desired outcome, not an unauthorized implementation.
- The owner changes status to `in-progress`, records questions and sets `blocked` if requirements are unclear, then implements only within their ownership.
- Before handoff, the owner records changed files, behavior/contract, errors or UI states, verification, limitations, and follow-up. Set `ready-for-<requester>` for review.
- The requester verifies the agreed acceptance criteria. If another role must act, append a handoff note and set the matching `ready-for-<owner>` status. Set `done` only when the request is accepted.
- Keep requests as Git history; do not delete completed or blocked requests. No concurrent work on overlapping files without explicit coordination.

Statuses: `draft`, `ready-for-kiro`, `ready-for-opencode`, `in-progress`, `blocked`, `ready-for-requester`, `done`.

Request status and requester review status are separate fields. Review status is only `pending`, `accepted`, or `changes-requested`; do not invent values such as `completed`.

## Cross-repository requests

- Each repository has its own `AI-HANDOFF.md` and `AI-HANDOFF/requests/`; open the request in the repository that owns the work.
- Reference the paired request by repository and full path. Do not copy request bodies between repositories.
- Split a change that spans repositories into one request per repository and track the pair by ID.
- Never edit files in another repository from this one; use its own request channel.

## Request template

```md
# REQ-<number>: <short title>

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

## Safety and product boundaries

- A handoff request is not approval for deployment, production data changes, migrations, commits, or publication.
- Never include secrets, credentials, personal information, or customer data.
- Never guess: verify behavior against source or runtime evidence, and state facts, assumptions, and unimplemented behavior distinctly; do not claim untested functionality.
- Commit inside the current repository only; never push, deploy, or run production migrations without explicit owner approval.
- Core owns consolidated accounting, organization reporting, cost/profit analysis, and tax workflows. Business modules own their operational records and communicate through authenticated, idempotent API/Bridge contracts; never access another app's database directly.
- Current `order.paid` / `payment.received` events do not imply support for all service, rental, hotel, pharmacy, retail inventory, or F&B domain data.
