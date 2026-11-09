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

These are implementation requirements and observed controls, not a guarantee that every route or query is already compliant. See [AUDIT.md](./AUDIT.md) for known findings and test limitations.

- Tenant-owned data must be queried and changed using the authenticated user's company context. Do not assume every existing query has been verified; tenant isolation remains an audit concern.
- Authentication uses a custom `jose` JWT in the `session-token` cookie (HS256, one-day expiry). The cookie is `httpOnly`, `sameSite=lax`, and `secure` in production.
- Password verification uses `bcryptjs`.
- Offline license keys use HMAC-SHA256 with `LICENSE_SALT`.
- Do not return secrets such as OAuth tokens or RD API keys to the browser; expose only non-secret status indicators where appropriate.
- `proxy.ts` applies session and role-based route checks. API handlers must also enforce authorization for their operations; proxy pass-through/public paths do not grant permission.
- Migration scripts should be reviewed and tested on an isolated disposable database before any production change; do not assume every migration has been proven idempotent.
- SSO has an open high-severity finding in [AUDIT.md](./AUDIT.md) and must not be represented as production-ready until remediated and verified.

## Out of Scope
- Vulnerabilities in third-party dependencies (report upstream; we track via `npm audit`).
- Social engineering / phishing.
- Denial of service via resource exhaustion on self-hosted instances.

## Disclosure Policy
We follow coordinated disclosure: we will credit reporters (unless anonymous) in release notes after a fix is available. Please allow up to 90 days before public disclosure.
