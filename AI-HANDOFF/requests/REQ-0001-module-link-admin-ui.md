# REQ-0001: Core admin UI — module link codes and linked shops

- Status: ready-for-kiro
- Requester: OpenCode
- Owner: Kiro
- Related request: module-side requests `REQ-002` (Retail) and `REQ-001` (Rental, Pharmacy, Hotel, FNB, Service)
- Screens/routes: Core admin area (choose an existing admin/settings route; suggested `/admin/module-links`)
- Related files: `app/api/bridge/link/{code,list,revoke}/route.ts`, `lib/module-links.ts`

## Goal / user need

A Core admin needs a screen to optionally connect a customer's module shop (Retail, Rental, Pharmacy, Hotel, FNB, Service) to the admin's Core company, and to see/revoke existing links. Linking is always optional: modules sell without Core.

## Context and evidence

- Flow (ADR-0006): Core admin generates a one-time 8-character code for one module → module admin enters it in the module → module calls Core and proves ownership → Core stores an active link → module replays queued `order.paid` events.
- A link code is bound to `(module, Core company)`, expires in 15 minutes, and is single-use. Only the SHA-256 hash is stored; the plaintext code is returned once.
- One Core company can have **one active shop per module** (e.g. one retail shop + one hotel shop). A second shop in the same module is rejected with `LINK_ALREADY_ACTIVE`.
- Revoking keeps history; it does not delete rows. After revoke the shop can be linked again with a new code.
- Backend is implemented and tested against a disposable database; it is **not deployed**.

## API contract (implemented)

All routes require an admin session for the UI. Responses are JSON.

### `POST /api/bridge/link/code`

Body:

```json
{ "module": "retail", "company_id": 1 }
```

- `module` is required: `retail | rental | pharmacy | hotel | fnb | service`.
- `company_id` is optional. A company admin must omit it or send their own id; a superadmin may target another company.

Success `200`:

```json
{
  "success": true,
  "code": "K7M2P9XA",
  "module": "retail",
  "company_id": 1,
  "company_name": "Your Company",
  "expires_at": "2026-11-10T10:15:00.000Z"
}
```

Errors (JSON `{ success: false, error, error_code }`):
- `401 UNAUTHORIZED` — no session.
- `403 FORBIDDEN` — not an admin.
- `400 MODULE_INVALID` — unknown module.
- `403 TENANT_MISMATCH` — `company_id` is not the caller's company.
- `404 COMPANY_NOT_FOUND` — company doesn't exist.
- `429 RATE_LIMITED` — more than 10 codes per company/module in 10 minutes.
- `503 LINK_TABLE_MISSING` — migration not applied.

UI must show the code once with a copy button plus the expiry time. Do not keep it in client storage after leaving the screen.

### `GET /api/bridge/link/list[?all=1][&include_revoked=1][&module=retail]`

- Company admin: only links for their own company.
- Superadmin: `all=1` lists every company.

Success `200`:

```json
{
  "success": true,
  "all": false,
  "links": [
    {
      "module": "retail",
      "shop_code": "R7K2M9A",
      "shop_name": "Shop A",
      "owner_email": "owner@example.com",
      "company_id": 1,
      "company_name": "Your Company",
      "status": "active",
      "linked_at": "2026-11-10T10:00:00.000Z",
      "revoked_at": null
    }
  ]
}
```

### `POST /api/bridge/link/revoke`

Body:

```json
{ "module": "retail", "shop_code": "R7K2M9A", "reason": "customer request" }
```

- `reason` is optional (max 500 chars).
- A company admin can revoke only links of their own company (foreign links return `404 LINK_NOT_FOUND`). A superadmin can revoke any.

Success `200`:

```json
{ "success": true, "module": "retail", "shop_code": "R7K2M9A", "revoked_at": "2026-11-10T10:20:00.000Z" }
```

Errors: `401`, `403`, `400 MODULE_INVALID`, `400 SHOP_CODE_INVALID`, `404 LINK_NOT_FOUND`, `503 LINK_TABLE_MISSING`.

## Requested outcome

Build the Core admin screen(s) for the three routes above. Keep all UI work within Kiro ownership: do not edit the route handlers, `lib/module-links.ts`, migrations, or auth logic. If the UI needs more data than the listed responses, create a new `ready-for-opencode` request instead of changing the API.

Suggested UX:

1. A module picker and a short explanation that linking is optional.
2. “Create link code” action with one-time code, copy button, and countdown/expiry.
3. A list of active links (module, shop name, shop code, company, linked date) with a revoke confirmation.
4. Empty, loading, error, and success states in Thai, matching the existing Core admin UI.
5. A clear warning that revoking stops future finance sync from that shop; historical records stay.

## Acceptance criteria

- [ ] Company admin sees and revokes only their own company's links.
- [ ] Module selection covers all six modules and an invalid value is impossible from the UI.
- [ ] Link code is shown once with copy + expiry, and disappears after navigation.
- [ ] Revoke asks for confirmation and shows `LINK_NOT_FOUND` as a friendly “already revoked” message.
- [ ] `RATE_LIMITED`, `TENANT_MISMATCH`, `LINK_TABLE_MISSING`, `401`, and `403` each have readable Thai states.
- [ ] The page works on mobile and desktop and keeps accessible labels, focus states, and keyboard use.
- [ ] No backend/API/DB files are changed; no deployment, migration, or commit is performed as part of this request.
- [ ] Run the narrowest applicable lint/typecheck and record exact results.

## Owner plan / questions

- Confirm the exact admin route/component location before editing to avoid overlapping OpenCode-owned files.
- If the admin area already has a settings shell, add the screen there instead of creating a new top-level route.
- Set `blocked` if the existing admin UI cannot represent the company scope (for example, a superadmin-only shell).

## Handoff result

- Changed files:
- UI behavior or system/API contract:
- Authorization and validation (system work):
- Error/loading/empty/success behavior:
- Verification and test results:
- Limitations / follow-up:

## Requester review

- Status: pending
- Notes:
