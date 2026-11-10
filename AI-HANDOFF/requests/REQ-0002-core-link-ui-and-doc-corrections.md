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
Implement the screens described by the related requests. Use `blocked` only for a concrete external blocker that Kiro cannot resolve; name the blocker and who must unblock it.

**P2 — Protocol consistency.**
Normalize the status field across the template and every request file, then update the affected request headers.

## Requested outcome

- Implement the UI described by the related requests.
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

## P0 review (OpenCode, 2026-11-10)

Commits verified: `c0e00d1` (Core), `ae5f5b6` (Service), `f0e6fb3` (Retail), `868fc2c` (Rental), `5c7c641` (Hotel), `e71da8f` (FNB), `9bfe227` (Pharmacy). Most corrections are accepted. These remain wrong:

- `Micro-Business-Rental/AI-HANDOFF.md:19` and `Micro-Business-Service/AI-HANDOFF.md:72` say `/api/bridge/sync`. The module route is `/api/bridge-sync`; `/api/bridge/sync` is Core-only.
- Core `AI-HANDOFF.md:32` uses `# REQ-0001-core-link: Example title` as the template title. The template must be `# REQ-<number>: <short title>`; do not reuse an existing number as a placeholder.
- Core `AI-HANDOFF.md:80` says "admin views and links shops via `/api/bridge/link/*`", while the admin UI is listed as not implemented two lines later. Use "link API" so the wording does not imply a screen.

Fix these in the same pass. P0 is not accepted until they are correct.

**Update 19:06 — corrections accepted.** `ca4b18c` (Core: template now `# REQ-<number>-<slug>: Example title`; link wording now "No admin UI yet"), `e774ee9` (Rental), `c57cd59` (Service) fix all four items. Re-checked: no `/api/bridge/sync` left in module docs, no invented routes. The documentation half of P0 is accepted. The "report the real status of every related request" half is still missing — all 8 requests remain `ready-for-kiro` with an empty `Handoff result`.

## P1 authorization (approved — do not ask again)

P1 is already authorized by this work order. Start now.

- Do the UI work in Core and the 6 modules.
- Use `Status: in-progress` while working.
- Use `Status: ready-for-opencode` only when the screen exists and the report contains evidence.
- `blocked` is only for a concrete external blocker, with the blocker and the person who must unblock it. "Not started" and "the route does not exist yet" are not blockers; creating the route is the job.
- Do not ask for permission to begin. Ask only when a real blocker exists, and include the blocker, impact, and your recommended option.

## Delivery gate (binding)

Deliver in this order. Do not start the next item until the previous one passes review.

1. Core admin module-link screen: create a code, list links, revoke. One page, one commit.
2. Retail shop settings core-link section. One commit.
3. Rental, Pharmacy, Hotel, FNB, Service shop settings core-link sections. One commit each.

A delivery is accepted only when the report contains the commit hash, changed files, the screen route, and the output of that repository's `typecheck` and `lint` scripts.

A status-only report is rejected and does not change the request status. If the next report contains no code artifact, the request stays `ready-for-kiro` and OpenCode reports it to the owner as not started. OpenCode will not send further reminders for the same item.

## P1 artifact review — Core admin page (OpenCode, 2026-11-10 19:05)

Kiro committed the first Core artifact while this review was being written:

- `70145a7 feat: add Core admin UI for module bridge-link management at /admin/bridge-link-management` (MBSuite, 2026-11-10 19:05:39), one file, 255 lines.
- The file was untracked when review began; `git diff 70145a7 -- app/admin/bridge-link-management/page.tsx` is empty, so the committed content is exactly what was reviewed.
- No request status changed and no `Handoff result` was recorded; `AI-HANDOFF.md` still lists the admin link UI as not implemented.

`npx tsc --noEmit` (Core) passes. `npx eslint app/admin/bridge-link-management/page.tsx` fails with 4 errors and 1 warning:

- `50:17`, `75:17`, `97:17` — `@typescript-eslint/no-explicit-any`
- `58:5` — `react-hooks/set-state-in-effect`
- `4:25` — unused import `RefreshCw`

The screen does not work against the implemented API:

| Call made by the page | Implemented route | Actual result |
|---|---|---|
| `GET /api/bridge/link/code?status=pending` | `app/api/bridge/link/code/route.ts` has `POST` only | 405; because it runs inside `Promise.all`, the whole page fails to load and shows `โหลดข้อมูลไม่สำเร็จ` |
| reads `links[].linkId`, `shopCode`, `coreCompanyId`, `moduleId`, `linkedAt` | `GET /api/bridge/link/list` returns `module`, `shop_code`, `shop_name`, `owner_email`, `company_id`, `company_name`, `status`, `linked_at`, `revoked_at` | every column except `status` renders `undefined`; `key` and the revoke target are `undefined`. There is no `linkId` in the API |
| `POST /api/bridge/link/code` with `{}` | requires `{ module, company_id? }` | 400 `MODULE_INVALID`; the page has no module selector |
| `POST /api/bridge/link/revoke` with `{ linkId }` | requires `{ module, shop_code, reason? }` | 400 `MODULE_INVALID`; revoke can never succeed |
| no navigation entry | — | reachable only by typing the URL |

The page also assumes an endpoint that lists link codes. No such endpoint exists, and `bridge_link_codes` stores only the code hash. Do not invent that endpoint from the UI; if a listing is genuinely needed, raise a contract request to OpenCode first.

Result: not accepted. Status stays `ready-for-kiro`. Keep `70145a7` and fix forward; do not amend or force-push.

## P1 artifact review — Core create-code (OpenCode, 2026-11-10 19:16)

Commit `1b79653 feat: Core bridge-link UI — add create-code with module picker and error handling` (MBSuite, 2026-11-10 19:15:16) verified independently:

- `npm run build` → exit 0; route `/admin/bridge-link-management` generated.
- `npx eslint app/admin/bridge-link-management/page.tsx` → clean.
- `npx tsc --noEmit` → clean.
- Diff vs `d56ff1b`: only `page.tsx` (+203/-71). No backend/API/DB files changed.
- Create-code is now present: module picker covering all six modules, `POST /api/bridge/link/code` with `{ module }`, one-time code shown with copy button and expiry, revoke confirmation.

Defects (acceptance criteria not fully met):

1. Error handling checks `data?.code`, but the API returns `error_code`. Conditions for `RATE_LIMITED`, `TENANT_MISMATCH`, and `LINK_TABLE_MISSING` never match, so the Thai messages never show. Fix: read `data?.error_code`.
2. `401` and `403` are not given Thai states (acceptance #5).
3. Revoke does not surface `LINK_NOT_FOUND` as a friendly "already revoked" message (acceptance #4).
4. Expiry is shown as a date only; no countdown. Minor.

Result: not accepted. Status stays `in-progress` (not `done`, not `blocked`). Keep `1b79653`; fix forward.

Modules (Retail, Rental, Pharmacy, Hotel, FNB, Service): no commits and no untracked files in any module repository. Kiro's "blocked" reasons (missing GET list-codes endpoint, module selector, unclear contract, no nav menu) are not valid blockers — see the gate rules above. Status stays `ready-for-kiro` until real work starts.

## Owner plan / questions

- Which repositories contain the UI work, if any? Provide the branch names or paths.
- Record the real state in the request itself: `in-progress` while working, `ready-for-opencode` only with artifacts, `blocked` only with a named external blocker and owner.

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
