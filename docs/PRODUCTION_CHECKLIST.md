# Production Readiness Checklist — Micro-Business-Suite

อัปเดตล่าสุด: 2026-11-09

## สถานะ Release gates — ยังไม่ผ่าน

- **ยังห้ามสรุปว่า Production Ready หรือผ่านการรับรองจาก checklist นี้**
- Gate 1 (Dev): ต้องสมัครสมาชิกและลบสมาชิกได้จริงบนฐาน Dev จึงจะถือว่าผ่านการทดสอบรอบนี้
- สิ่งที่ยืนยันแล้วบนฐาน disposable ในเครื่อง: สมัคร Rental/Hotel → login ด้วยบัญชีใหม่
  → หน้า dashboard ตอบ 200 และแสดงชื่อบริษัท → ลบสมาชิกสำเร็จ
- ผลทดสอบนี้ไม่ใช่การยืนยันบนฐาน Dev; Gate 1 ยังไม่ผ่าน
- **ยังไม่ได้** ยืนยัน signup และ delete จริงบนฐาน Dev จึงยังไม่ผ่าน Gate 1
- SSO ข้ามแอปถูกถอดออกจาก source ทั้ง Core และ 6 modules แล้ว; ระบบใช้การล็อกอินแยกต่อแอป
  และไม่มี release gate ด้าน SSO อีก (คอลัมน์ `core_user_id` เดิมคงไว้โดยไม่ลบ)
- เจ้าของยืนยันว่า Neon เป็นฐาน Dev และ Supabase เป็นฐาน Production; ไม่มีการเขียน
  ข้อมูลทดสอบลง Supabase Production
- Gate 2 (หลัง Gate 1 ผ่าน): ทำและตรวจ 2FA
- Gate 3: พิจารณา Production ได้ก็ต่อเมื่อ 2FA ผ่านและมีการอนุมัติ deploy

## ผลตรวจเดิม (ไม่ใช่ Production sign-off)

รายการที่ทำเครื่องหมายด้านล่างเป็นผลตรวจ/บันทึกเดิม ณ 2026-11-07 เท่านั้น
ไม่ใช่หลักฐานว่า production พร้อมใช้งานในปัจจุบัน และไม่แทนเกณฑ์ signup/delete
บนฐาน Dev หรือ 2FA ที่ยังไม่ได้ตรวจ

### Build & Quality
- [x] `npm run build` — ผ่าน (Compiled successfully)
- [x] `tsc --noEmit` — ผ่าน (0 errors)
- [x] `npm run lint` — 0 errors (327 warnings)
- [x] `pnpm test` — 31 passed, 15 skipped, 0 failed (local workspace; integration tests skipped by default)
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
- [ ] `migrations/add_integration_webhook_idempotency.sql` — validated on disposable local PostgreSQL; target environment migration not applied
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
- [x] **Integration tests** — security 14/14 และ registration 2/2 pass on disposable Docker container `mbs-integration-pg` (2026-11-09); registration verifies signup → login → dashboard HTTP 200 with the new company name → member deletion; not Dev gate or Production acceptance
- [x] **Unit tests** — `npm test`: 44 passed, 14 skipped, 0 failed (includes 13 tax-automator tests); integration cases skip unless `MBS_TEST_*` is set
- [x] **Typecheck / lint** — `tsc --noEmit` 0 errors; `eslint` 0 errors, 331 warnings

### Vulnerabilities
- [x] ไม่มี SSO หรือ cross-site token exchange ใน source — ถอด endpoint/callback/JWKS/allowlist ออกแล้ว; ไม่มี checklist ด้าน SSO ค้าง
- [x] Legacy webhook idempotency and missing-company fail-closed behavior verified on the disposable local integration database.

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

## สรุปผลตรวจเดิม

ผลตรวจ build และฐานข้อมูลแบบอ่านอย่างเดียวด้านล่างเป็นข้อมูลย้อนหลัง ไม่ใช่
production acceptance ของงานสมัคร/ลบสมาชิกในปัจจุบัน:

- Build / TSC ผ่าน, Lint 0 errors (327 warnings)
- ผลเดิมของ unit 8/8 และ integration 9/9 ถูกแทนที่ด้วยผลตรวจล่าสุดที่บันทึกไว้ด้านบน
- ทุก env ตั้งครบ (Google Drive, Gmail, Gemini AI, Recurring billing, License, Auth)
- DB: 53 ตาราง, core tables ครบ, column types ตรง

**แก้ไขแล้ว (ตาม audit):**
- Backup route: restrict to superadmin only (ป้องกัน data leakage ข้ามบริษัท)
- Reset billing: superadmin only + transaction + company scope
- auth.ts: ย้าย runtime company_id backfill ไป migration
- CSP: ลบ unsafe-eval, จำกัด connect-src
- start script: เปลี่ยนเป็น node .next/standalone/server.js (consistent with Docker)

**ยังมีข้อจำกัด (ต้องยืนยัน):**
- Rate limiter in-memory (single-instance only)
- CSP ยังมี unsafe-inline (Next.js ต้องการ)
- Historical credentials in git history (ควร rotate ถ้าเคย live)
- เจ้าของยืนยันว่า Neon เป็นฐาน Dev และ Supabase เป็นฐาน Production

**สถานะ Dev gate: ยังไม่ผ่าน** — ต้องยืนยัน signup และ delete บนฐาน Dev ก่อน
เริ่ม 2FA; Production release ยังถูกกั้นจนกว่า 2FA จะผ่านและได้รับอนุมัติ
