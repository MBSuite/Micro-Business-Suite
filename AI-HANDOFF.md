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
- The requester creates `REQ-<id>.md`, sets `Status: ready-for-<owner>`, and describes the desired outcome, not an unauthorized implementation.
- The owner changes status to `in-progress`, records questions and sets `blocked` if requirements are unclear, then implements only within their ownership.
- Before handoff, the owner records changed files, behavior/contract, errors or UI states, verification, limitations, and follow-up. Set `ready-for-<requester>` for review.
- The requester verifies the agreed acceptance criteria. If another role must act, append a handoff note and set the matching `ready-for-<owner>` status. Set `done` only when the request is accepted.
- Keep requests as Git history; do not delete completed or blocked requests. No concurrent work on overlapping files without explicit coordination.

Statuses: `draft`, `ready-for-kiro`, `ready-for-opencode`, `in-progress`, `blocked`, `ready-for-requester`, `done`.

## Request template

```md
# REQ-<id>: <short title>

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
- State facts, assumptions, and unimplemented behavior distinctly; do not claim untested functionality.
- Core owns consolidated accounting, organization reporting, cost/profit analysis, and tax workflows. Business modules own their operational records and communicate through authenticated, idempotent API/Bridge contracts; never access another app's database directly.
- Current `order.paid` / `payment.received` events do not imply support for all service, rental, hotel, pharmacy, retail inventory, or F&B domain data.
