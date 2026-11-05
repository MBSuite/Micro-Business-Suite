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

## Security Practices
- Multi-tenant isolation: every query is scoped by `company_id` from the authenticated session.
- Authentication: JWT session cookie (`session-token`), HS256, 1-day expiry.
- Passwords hashed with bcrypt.
- Offline license keys signed with HMAC-SHA256 (`LICENSE_SALT`).
- Secrets (OAuth tokens, RD API keys) are never returned to the browser; only `has_*` booleans are exposed.
- Admin routes are guarded by role (superadmin/admin) in middleware and API.
- Database migrations are idempotent and use guarded constraints.

## Out of Scope
- Vulnerabilities in third-party dependencies (report upstream; we track via `npm audit`).
- Social engineering / phishing.
- Denial of service via resource exhaustion on self-hosted instances.

## Disclosure Policy
We follow coordinated disclosure: we will credit reporters (unless anonymous) in release notes after a fix is available. Please allow up to 90 days before public disclosure.
