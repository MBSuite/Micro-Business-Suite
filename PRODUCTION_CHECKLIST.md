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
  - `GMAIL_FROM` ✅
  - `GMAIL_APP_PASSWORD` ✅
  - `GEMINI_API_KEY` ✅
  - `RECURRING_SECRET` ✅
  - `CRON_ENABLED` ✅

### Environment
- [x] `NEXTAUTH_URL` = `https://micro-business-suite.vercel.app`
- [x] `SEED_ADMIN_PASSWORD` = strong (24 chars)
- [x] `.secure/initial-admin-credential.txt` ลบแล้ว

---

## ⚠️ ยังไม่ทำ (ขึ้นกับการใช้งาน)

### Secret ที่ต้องตั้ง (ถ้าใช้ feature นั้น)
- [x] **Gmail (email)** — ตั้งแล้ว (`GMAIL_APP_PASSWORD` + `GMAIL_FROM`)
- [x] **Gemini AI (AI auditor)** — ตั้งแล้ว (`GEMINI_API_KEY`)
- [x] **Recurring billing (cron)** — ตั้งแล้ว (`RECURRING_SECRET` + `CRON_ENABLED=true`)

### Testing
- [x] **Integration tests** — รันแล้ว: 9/9 pass, 0 fail (exit code 0) บน Docker container `mbs-integration-pg`

### Vulnerabilities
- [x] **2 moderate vulns** (accepted risk)
  - `glob` + `minimatch` (transitive ของ `googleapis`)
  - override พัง build / เพิ่ม high vulns → revert กลับ
  - กระทบเฉพาะ Google Drive integration (cleanup temp files), ไม่กระทบ core logic
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

**พร้อม production เต็มรูปแบบแล้ว** ✅

ทุก env ตั้งครบ (Google Drive, Gmail, Gemini AI, Recurring billing, License, Auth)
Integration tests 9/9 pass, Unit tests 8/8 pass
Build / TSC / Lint ผ่าน (0 errors)

**เหลือเพียง (accepted risk):**
- 2 moderate vulns (glob/minimatch transitive ของ googleapis) — แก้ไม่ได้โดยไม่เสี่ยง build
- Integration tests รันแล้ว 9/9 pass

**พร้อม production เต็มรูปแบบ** ครับ.