# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| latest (main) | ✅ |
| older releases | ❌ |

## Reporting a Vulnerability

If you discover a security vulnerability in Micro-Business-Suite, please report it
responsibly. **Do not** open a public GitHub issue for security-sensitive bugs.

- Email: security@microtronic.biz
- Include: description, reproduction steps, impact, suggested fix (optional)
- We aim to acknowledge within 72 hours and provide a fix/mitigation plan within 14 days.

## Security Controls and Limitations

These are implementation requirements and observed controls, not a guarantee that every route or query is already compliant. See [docs/AUDIT.md](./docs/AUDIT.md) for known findings and test limitations.

- Tenant-owned data must be queried and changed using the authenticated user's company context. Do not assume every existing query has been verified; tenant isolation remains an audit concern.
- Authentication uses a custom `jose` JWT in the `session-token` cookie (HS256, one-day expiry). The cookie is `httpOnly`, `sameSite=lax`, and `secure` in production.
- Password verification uses `bcryptjs`.
- Offline license keys use HMAC-SHA256 with `LICENSE_SALT`.
- Do not return secrets such as OAuth tokens or RD API keys to the browser; expose only non-secret status indicators where appropriate.
- `proxy.ts` applies session and role-based route checks. API handlers must also enforce authorization for their operations; proxy pass-through/public paths do not grant permission.
- Migration scripts should be reviewed and tested on an isolated disposable database before any production change; do not assume every migration has been proven idempotent.
- There is no cross-site login or SSO. Each app (Core and the six modules) authenticates its own users with the custom `jose` JWT and issues its own session cookie; no token is shared across app domains.
- Database target: Neon for Dev and for the currently deployed Production runtime (verified live in `docs/DECISIONS.md`, Gate 3, 2026-11-11). Re-verify the live target before choosing a migration/deploy target and obtain owner approval. Each app's users live under its own table prefix; legacy `core_user_id` columns are unused.
- Multi-statement writes use one pinned `pg` client (`BEGIN`/`COMMIT` on the same connection). `query()` in `lib/db.ts` is `pool.query` and must never be used for transaction control.
- Bridge idempotency keys are unique per tenant: `(company_id, idempotency_key)`. A service token that may supply `company_id` must be scoped to the specific module/tenant; otherwise a shared token can write into another company.
- Password-reset tokens are single-use (jti ledger) and expire in one hour. Reset URLs and tokens are never written to logs. A password change invalidates sessions issued before the change.
- Backup exports redact secret columns by name before any optional AES encryption; encryption is defense in depth, not a substitute for redaction.
- 2FA recovery codes are consumed with one conditional `UPDATE ... RETURNING` so concurrent requests cannot reuse a code.

## Out of Scope
- Vulnerabilities in third-party dependencies (report upstream; we track via `npm audit`).
- Social engineering / phishing.
- Denial of service via resource exhaustion on self-hosted instances.

## Disclosure Policy
We follow coordinated disclosure: we will credit reporters (unless anonymous) in release notes after a fix is available. Please allow up to 90 days before public disclosure.
