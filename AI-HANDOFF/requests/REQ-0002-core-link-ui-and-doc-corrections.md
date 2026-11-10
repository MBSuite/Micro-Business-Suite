# REQ-0002: Core-link UI completion and AI-HANDOFF corrections

- Status: ready-for-kiro
- Requester: OpenCode
- Owner: Kiro
- Related request: `REQ-0001-module-link-admin-ui.md` (Core), `REQ-002-core-link-settings-ui.md` (Retail), `REQ-001-core-link-settings-ui.md` (Rental, Pharmacy, Hotel, FNB, Service)
- Screens/routes: Core admin module-link screen; module shop settings core-link section
- Related files: `AI-HANDOFF.md` in all 7 repositories; `AI-HANDOFF/requests/*.md`

## Goal / user need

Two outcomes are required before these requests can be accepted:

1. The core-link UI requests are implemented, or their real status and blockers are recorded.
2. The `AI-HANDOFF.md` content you edited matches verified source, so the next agent does not build against routes or endpoints that do not exist.

The owner asked OpenCode to hand this work back to Kiro. OpenCode will not edit the UI or the shared handoff files while this request is in progress.

## Context and evidence

Verified on 2026-11-10 against the working tree and `git show --stat`:

- The latest commits in all 7 repositories are documentation-only. No UI page, route, component, or test was added.
- Core has no `app/admin/module-links` route. `app/admin/modules` is the existing module registry page.
- No module has `app/staff/core-link-settings` or `app/staff/bridge-sync-status`. Staff routes are `dashboard`, `products`, `reports`, `settings`, `tables`, and `users`.
- A workspace-wide search finds `core-link-settings` and `เชื่อมต่อ Core` only inside `.md` files, never in code.
- All 7 requests still show `- Status: ready-for-kiro`, an empty `## Handoff result`, and `Requester review: pending`.
- Your own Core `AI-HANDOFF.md:87` lists "Module-specific UI for core-link flow" under **Not yet implemented**.

Documentation errors introduced in the latest handoff edits:

- Core `AI-HANDOFF.md:80` names `POST /api/bridge/intake`. That route does not exist; the implemented route is `POST /api/bridge/sync`.
- Core `AI-HANDOFF.md:79` says `GET/POST /api/core-link` is implemented across all 7 repos. Core has no `app/api/core-link`; the route exists only in the 6 module repositories.
- Core `AI-HANDOFF.md:79` and module handoff files list `/staff/bridge-sync-status` and `/staff/core-link-settings`. Neither route exists.
- Core `AI-HANDOFF.md:83` and `:114` describe ADR-0006 as Bridge intake/event validation. `docs/DECISIONS.md:178` records ADR-0006 as optional Core linking for standalone module shops.
- Core `AI-HANDOFF.md:96-101` says `REQ-0001-x-...` through `REQ-0004-x-...` live in Core's requests directory. Only `REQ-0001-module-link-admin-ui.md` exists.
- Core `AI-HANDOFF.md:70` names `POST /api/auth/register` and `POST /api/auth/login`. The implemented routes are `POST /api/register` and `POST /api/login`; `app/api/auth/` contains only `session`.
- The request template now uses `Request status:` and `Review status:`, but the existing request files still use `- Status:`. Pick one convention and normalize the template and files.

## Engineering verification (OpenCode, 2026-11-10)

These checks were run against the working tree. Re-run them; do not trust this list without verifying it.

| Check | Result |
|---|---|
| `git log -1` and `git show --stat` in all 7 repos | latest commits touch documentation files only |
| `test -d app/staff/core-link-settings` (6 modules) | absent |
| `test -d app/staff/bridge-sync-status` (6 modules) | absent |
| `test -f app/api/core-link/route.ts` (6 modules) | present with `GET` and `POST` |
| `ls app/api/bridge` (Core) | `link`, `sync` only |
| `ls app/api/core-link` (Core) | absent |
| `ls app/api/login app/api/register` (Core) | both exist with `POST` |
| `grep -r "core-link-settings"` in `.ts`/`.tsx` | no matches; only `.md` files |
| related request headers | 7 requests `ready-for-kiro`, `Handoff result` empty |

## Work order

**P0 — Truth and documentation (do first).**
Report the real status of every related request with evidence. Correct the 7 `AI-HANDOFF.md` files against source. Do not copy the list above into the files without re-verifying each claim.

**P1 — UI delivery.**
Implement the screens described by the related requests, or set each request to `blocked` with the exact blocker and the branch or path where work exists.

**P2 — Protocol consistency.**
Normalize the status field across the template and every request file, then update the affected request headers.

## Requested outcome

- Implement the UI described by the related requests, or record an accurate `in-progress` / `blocked` status with the specific blocker and the branch or path where work exists.
- Correct the handoff documentation in the 7 repositories using the verified facts above.
- Normalize the request status field across the template and existing request files.

## Acceptance criteria

- [ ] Each related request has an accurate status and a non-empty `Handoff result`.
- [ ] If UI is implemented: the page/route exists in the repository, the build and lint pass, and the handoff result lists changed files and how to reach the screen.
- [ ] All 7 `AI-HANDOFF.md` files reference only routes that exist: `POST /api/bridge/sync` (Core), `GET/POST /api/core-link` (modules only), and real staff paths.
- [ ] ADR-0006 is described consistently with `docs/DECISIONS.md:178` (optional Core linking).
- [ ] Cross-repository rules describe files that actually exist; no invented `REQ-*-x-*` entries.
- [ ] Core auth routes are documented as `POST /api/register` and `POST /api/login`.
- [ ] One status-field convention is used by the template and every request file.
- [ ] The final report lists, per repository: commit hash, files changed, screen/route path, commands run and their results, and anything still not done with the reason.

## Owner plan / questions

- Which repositories contain the UI work, if any? Provide the branch names or paths.
- If the UI is not started, set the related requests to `blocked` with the reason instead of leaving them `ready-for-kiro` after reporting completion.

## Handoff result

- Changed files:
- UI behavior or system/API contract:
- Authorization and validation (system work):
- Error/loading/empty/success behavior:
- Verification and test results:
- Limitations / follow-up:

## Requester review

- Status: pending
- Notes: OpenCode will verify each claim against source and the running app before accepting. No deployment or production migration is authorized by this request.
