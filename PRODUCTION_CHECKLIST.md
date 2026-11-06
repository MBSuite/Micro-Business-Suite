# Production Readiness Checklist — Micro-Business-Suite

อัปเดตล่าสุด: 2026-11-07
สาขา: main (clean)

## ✅ เสร็จแล้ว (พร้อม production)

### Build & Quality
- [x] `npm run build` — ผ่าน (Compiled successfully)
- [x] `tsc --noEmit` — ผ่าน (0 errors)
- [x] `npm run lint` — 0 errors (327 warnings)
- [x] `npm test` — 8/8 pass
- [x] Lint errors 23 รายการ — แก้หมด (TDZ, unescaped entities, `any`, Date.now, `<a>`→`<Link>`, setState-in-effect)

### Security
- [x] Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) — `next.config.ts`
- [x] Rate limiting (login 10/min, API 120/min per IP) — `proxy.ts`
- [x] Debug endpoints ปิด (`/api/debug/auth` → 404)
- [x] Cookie `session-token`: httpOnly, secure (prod), sameSite=lax
- [x] DB SSL strict (`rejectUnauthorized: true`)
- [x] Runtime DDL ถอดออก (AUD-02) — ไม่มี CREATE/ALTER ใน `app/` `lib/`
- [x] `.env*` + `.secure/` gitignored
- [x] License key valid (perpetual, PROFESSIONAL) — `MBS_LICENSE_KEY` ตั้งแล้ว

### Database
- [x] Migrations apply บน Neon — 53 tables
- [x] Column types ตรง (expenses, invoices, payment_vouchers) — `check:column-types` 3/3
- [x] Company settings + tenant scope migrations applied
- [x] Bootstrap runner idempotent (`scripts/bootstrap-init-db.mjs`)

### Performance
- [x] Dashboard queries parallelized (`Promise.all`) — TTFB ลดจาก ~5s → ~0.5s
- [x] `optimizePackageImports` (lucide, framer-motion, recharts, date-fns)
- [x] Favicon ตั้งค่า (`public/favicon.png` + metadata icons)

### UI / Bug fixes
- [x] Mobile sidebar scroll (bounded height + `min-h-0`)
- [x] Sidebar brand text: `MBSuite`

### Google Drive Integration
- [x] OAuth 2.0 Client ID สร้าง (MBSuite Web, Web application)
- [x] API Key สร้าง (HTTP referrers + Drive/Picker APIs)
- [x] `.env.local` ตั้งค่าครบ:
  - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` ✅
  - `GOOGLE_CLIENT_ID` ✅
  - `GOOGLE_CLIENT_SECRET` ✅
  - `GOOGLE_REDIRECT_URI` ✅
  - `NEXT_PUBLIC_GOOGLE_API_KEY` ✅
  - `GOOGLE_TOKEN_ENCRYPTION_KEY` ✅

### Environment
- [x] `NEXTAUTH_URL` = `https://micro-business-suite.vercel.app`
- [x] `SEED_ADMIN_PASSWORD` = strong (24 chars)
- [x] `.secure/initial-admin-credential.txt` ลบแล้ว

---

## ⚠️ ยังไม่ทำ (ขึ้นกับการใช้งาน)

### Secret ที่ต้องตั้ง (ถ้าใช้ feature นั้น)
- [ ] **Gmail (email)** — ต้อง `GMAIL_APP_PASSWORD` + `GMAIL_FROM`
  - สร้าง: https://myaccount.google.com/apppasswords (ต้องเปิด 2-Step Verification)
- [ ] **Gemini AI (AI auditor)** — ต้อง `GEMINI_API_KEY`
  - สร้าง: https://aistudio.google.com/apikey
- [ ] **Recurring billing (cron)** — ต้อง `RECURRING_SECRET` + `CRON_ENABLED=true`
  - สร้าง: `openssl rand -base64 32`

### Testing
- [ ] **Integration tests** — รัน `npm run test:integration` (ต้อง Docker daemon)
  - Container: `mbs-integration-pg` (postgres:16-alpine, port 54329)
  - 9 tests ยัง skip (ไม่มี `MBS_TEST_*` env)

### Vulnerabilities
- [ ] **2 moderate vulns** (accepted risk)
  - `glob` + `minimatch` (transitive ของ `googleapis`)
  - override พัง build / เพิ่ม high vulns → revert กลับ
  - แก้ได้เมื่อ googleapis release version ใหม่ที่ patch แล้ว

### Cold Start (Neon)
- [ ] **Neon scale-to-zero** — ถ้าช้าหลัง deploy:
  - Option 1: ปิด scale-to-zero ใน Neon Console (paid plan)
  - Option 2: Vercel Cron ping `/api/health` ทุก 4 นาที
  - Option 3: In-memory cache สำหรับ company settings/modules

---

## 🚀 Deploy Checklist

- [ ] ตั้ง env ทั้งหมดใน Vercel/Docker (production + preview)
- [ ] Deploy บน Vercel หรือ Docker
- [ ] Smoke test: login → dashboard → สร้าง invoice → ชำระเงิน → รายจ่าย → payroll
- [ ] ตรวจสอบ cold start (ถ้าช้า → เปิด Neon always-on หรือ Vercel Cron)
- [ ] ตรวจสอบ Google Drive connect/disconnect flow
- [ ] ตรวจสอบ health endpoint: `GET /api/health` → 200 OK

---

## สรุป

**พร้อม production สำหรับ core + Google Drive แล้ว** ✅

**ยังไม่พร้อมเต็ม** ถ้าต้องการ:
- Gmail notifications → ตั้ง `GMAIL_APP_PASSWORD` + `GMAIL_FROM`
- AI Auditor → ตั้ง `GEMINI_API_KEY`
- Automated recurring billing → ตั้ง `RECURRING_SECRET` + `CRON_ENABLED=true`
- Integration tests → รันบน Docker
- 2 moderate vulns → accepted risk (override พัง)

ถ้า **ไม่ใช้** features เหล่านี้ → **พร้อม production แล้ว** ครับ.
