# Source Audit — Micro-Business-Suite (Core)

**วันที่อัปเดต:** 2026-11-11
**ขอบเขต:** source review, automated checks บนฐาน disposable, และ Dev acceptance (Gate 1–2)
**ผลทดสอบ Dev/Production:** Gate 1 และ Gate 2 ผ่านบน Dev Neon; Production ยังไม่ได้ทดสอบ/ยังไม่ได้ migrate

## สรุป

Core ไม่มีระบบ SSO ข้ามแอป: endpoint ออก token/JWKS, callback และ allowlist ถูกถอดออกจาก source แล้ว และหน้า login รับเฉพาะอีเมล/รหัสผ่านของ Core เอง ส่วน webhook replay และ company fallback ได้รับการแก้ใน source และทดสอบบนฐาน disposable แล้ว Gate 1 (Dev signup/delete acceptance) และ Gate 2 (2FA บน Dev) ผ่านแล้วบน Dev Neon Production acceptance ยังไม่ผ่านและต้องรออนุมัติเจ้าของ

## Findings และสถานะปัจจุบัน

| ประเด็นเดิม | สถานะ source ปัจจุบัน | หลักฐาน/ข้อจำกัดที่ยังเหลือ |
|---|---|---|
| SSO ข้ามแอป (Core → module) | ถอดออกจาก source ทั้งหมด: ลบ `app/api/auth/sso-token`, `app/api/auth/jwks`, `app/auth/sso-callback`, `lib/sso-trust` และหน้า `/login` ไม่รับ `audience`/`redirect` แล้ว | คงคอลัมน์ `core_user_id` ที่มีอยู่ในฐานข้อมูลโดยไม่ลบ; ระบบไม่มีการล็อกอินข้ามเว็บ และไม่ได้ออกแบบให้ทำได้ |
| Legacy webhook สร้างข้อมูลซ้ำเมื่อ replay | แก้และทดสอบบนฐาน disposable แล้ว: บังคับ idempotency key และบันทึก event/result กับ invoice ใน transaction เดียว | migration `migrations/add_integration_webhook_idempotency.sql` ยังไม่ได้ apply บน environment เป้าหมาย |
| Auth เลือกบริษัทแรกเมื่อ company mapping หาย | แก้และทดสอบบนฐาน disposable แล้ว: ปฏิเสธ mapping ที่หายหรือไม่ถูกต้อง แทนการเลือก tenant เริ่มต้น | ตรวจและจัด mapping ผู้ใช้จริงด้วยข้อมูลที่เจ้าของอนุมัติก่อน rollout; ห้ามเดา tenant |

## ติดตามผลการตรวจ source (2026-11-09)

ตรวจซ้ำเฉพาะเส้นทางที่ระบุใน findings โดยไม่เชื่อม Production:

- **SSO — removed:** ไม่มี token exchange, JWKS, callback หรือ allowlist ของ Core→module ใน source; ทุกแอปเข้าสู่ระบบด้วยบัญชีของตนเองบนฐานข้อมูลร่วมกัน ไม่มี cross-site login
- **Legacy webhook — source fix verified locally:** `/api/integrations/webhook` requires an idempotency key and writes the event/result and invoice in one transaction. Duplicate concurrent delivery creates one invoice in the disposable integration test. The additive migration `migrations/add_integration_webhook_idempotency.sql` must be applied on each target environment before the endpoint is used.
- **Company fallback — source fix verified locally:** `getUserCompanyId` now rejects missing or invalid company mapping rather than returning the first company. The webhook integration test confirms an unmapped user receives `403`. Review/backfill unmapped real users with owner-approved mapping before rollout; do not infer their tenant.
- Verification on 2026-11-09: disposable integration harness passed security 14/14 and registration 2/2. Registration coverage creates trial tenants, logs in with each new account, requests `/`, verifies HTTP 200 and the new company name in dashboard HTML, then verifies member deletion. `npm test` passed 44 tests (13 of them tax-automator unit tests) with 14 integration cases skipped by the safety guard; `tsc --noEmit` reported 0 errors; `eslint` reported 0 errors and 331 warnings. This is local disposable-database evidence, not Dev or Production acceptance.
- All integration writes ran against named disposable local PostgreSQL container `mbs-integration-pg`. `.env.local` targets Neon Dev, but was moved aside by the harness and restored; no Neon or Production data was written. Local signup/delete acceptance is not the owner-required Dev acceptance and does not establish Production readiness.

## ข้อจำกัดและสิ่งที่ยังไม่ยืนยัน

- `npm test` โดยไม่มี test environment ข้าม integration cases ตาม safety guard; dedicated disposable harness รันผ่าน security 14/14 และ registration 2/2
- Local signup/delete test ไม่เท่ากับ Gate 1: signup และ delete จริงบน Dev ยังไม่ได้ยืนยัน
- ตาม `docs/DECISIONS.md`, เริ่ม 2FA หลัง Dev signup/delete ผ่านเท่านั้น; 2FA ยังไม่ได้ทำ/ทดสอบ
- ไม่ได้ตรวจ runtime configuration, Vercel logs, Dev acceptance หรือ Production
- Production deploy/migration/testing ยังไม่ได้ทำ; ไม่มีการเขียนหรือเปลี่ยนข้อมูล Production ในการตรวจครั้งนี้

## Gate 1 — Dev signup/delete acceptance (ผ่านแล้ว)

วันที่ทดสอบ: 2026-11-11 (Dev Neon)
หลักฐาน:
- ลงทะเบียน account ใหม่: `POST /api/register` → 200 `{"success":true,"message":"ลงทะเบียนสำเร็จ"}`
- login account ใหม่: `POST /api/login` → 200 พร้อม user object
- dashboard: `GET /` → 200 และ HTML มี company name ที่ลงทะเบียน
- admin ลบ member: `DELETE /api/users/{id}` → 200 `{"success":true,"deletedUserId":...}`
- session ของ member ที่ถูกลบ: `GET /api/bridge/sync` → 401
- ทดสอบเสร็จแล้วลบ test data ออกจาก Dev แล้ว (users/companies ที่ขึ้นต้น `devaccept`)

## Gate 2 — 2FA บน Dev Neon (ผ่านแล้ว)

วันที่ทดสอบ: 2026-11-11 (Dev Neon ผ่าน dev server local + `.env.local` ที่ชี้ Dev)
สิ่งที่ตรวจ (end-to-end ผ่าน HTTP จริง):

| ขั้นตอน | ผล |
|---|---|
| register ผู้ใช้ใหม่ (allowed origin) | 200 |
| login ก่อนเปิด 2FA ได้ session ตรงๆ | 200, มี session cookie |
| `POST /api/auth/2fa/setup` | 200 ได้ secret + otpauthUri |
| `POST /api/auth/2fa/enable` ด้วย TOTP ที่ถูกต้อง | 200 ได้ recovery codes 10 รายการ |
| `GET /api/auth/2fa/status` | enabled = true |
| login หลังเปิด 2FA | 200 + `requires2FA: true` + `pendingToken`, ไม่ออก session cookie |
| `verify-login` ด้วย TOTP ผิด | 401 |
| `verify-login` ด้วย TOTP ถูกต้อง | 200 + session cookie |
| `verify-login` ด้วย recovery code | 200 + session cookie |
| recovery code ที่ใช้ไปแล้วถูกปฏิเสธ | 401 |
| `POST /api/auth/2fa/disable` ด้วย TOTP | 200 |
| login หลังปิด 2FA ไม่ถูก challenge อีก | 200, ไม่มี requires2FA |

ผลรวม: 12/13 ขั้นตอนผ่าน — ที่เหลือ 1 รายการไม่ผ่านเป็นข้อสังเกตเชิงดีไซน์ ไม่ใช่ช่องโหว่ที่ bypass 2FA ได้ (ด้านล่าง)
ทดสอบเสร็จแล้วลบ test data ออกจาก Dev แล้ว (users/companies ที่ขึ้นต้น `gate2-2fa`, ยืนยัน remaining = 0, orphan recovery codes = 0)

### Design note — pendingToken ใช้ซ้ำได้ภายในอายุ 5 นาที

- `createTwoFactorPendingToken` เป็น stateless JWT (`purpose: "2fa_login"`, TTL 5 นาที) ไม่มีสถานะ server-side จึง verify ได้หลายครั้งในหน้าต่างเวลา
- การวิเคราะห์ความเสี่ยง: pendingToken อย่างเดียวไม่พอสร้าง session — ทุกครั้งที่ใช้ยังต้องผ่าน TOTP หรือ recovery code ที่ถูกต้องเสมอ; การ attempt ถูก rate-limit 20/min/IP และ TTL 5 นาทีจำกัดหน้าต่าง brute-force (~100 ครั้ง) เทียบกับ TOTP 6 หลัก (~10^6)
- สรุป: defense-in-depth ที่อาจเพิ่มได้ (เช่น เก็บ jti ที่ใช้แล้ว) แต่ไม่ใช่ข้อบังคับของ Gate 2; ถ้าเจ้าของต้องการ hardening นี้ให้สั่งเพิ่ม
- บันทึกตามกฎความจริง: integration test ถาวรใน `tests/integration-security.test.mjs` ไม่ได้ assert เรื่อง single-use (ไม่มี claim นั้นใน test ถาวร)

## Company mapping

- audit script `npm run audit:company-mappings` รันบนฐานข้อมูลจริง (production): 0 unmapped/invalid (2026-11-11)
- backfill migration ถูกแก้ให้ไม่เดา tenant แรกอีกต่อไป

## Gate 3 — การตรวจ environment จากระบบจริง + deploy (ผ่านแล้ว)

วันที่: 2026-11-11 · อนุมัติโดยเจ้าของ (migration + deploy)

### การตรวจ environment ตามคำสั่งเจ้าของ "ตรวจสอบจาก CODE เท่านั้น"

ผลตรวจจากระบบจริง (ไม่อิงเอกสารเก่า):

1. **Vercel project `micro-business-suite` (production):** env มี Neon integration vars (PGHOST, PGDATABASE, NEON_PROJECT_ID, NEON_AUTH_BASE_URL — Neon Auth vars สร้าง 2026-11-08) และ **ไม่มีตัวแปร Supabase เลย**
2. **โค้ดทั้ง repo:** ไม่มีคำว่า supabase ใน source/config/env ใดๆ; ไม่มี Supabase CLI/config ในเครื่อง
3. **Production DB identity probe (read-only):** login timing side-channel — `admin@mbsuite.app` และ `grids.bitcoin@gmail.com` (มีอยู่ในฐานข้อมูลที่ `.env.local` ชี้) ช้ากว่า email ที่ไม่มีอยู่ ~100ms (เท่ากับต้นทุน bcrypt 10 rounds ~110ms) ทั้งก่อนและหลัง deploy ใหม่ → **production app ใช้ฐานข้อมูลเดียวกับที่ `.env.local` ชี้ (Neon `ep-delicate-base-b31rx7ol`)**
4. **สรุป:** Dev (`.env.local`) และ production deployment ใช้ฐานข้อมูลเดียวกันในปัจจุบัน; ระบบไม่มี Supabase จริง แม้เอกสารเดิมจะอ้างถึง — ควรแยกฐานข้อมูล Dev/Production ในอนาคตหากเจ้าของต้องการ

### สถานะ migration บนฐานข้อมูล production (read-only verify)

- `integration_webhook_events`: มี (PK `(company_id, provider, event_id)` = idempotency)
- `user_recovery_codes`: มี
- `users.totp_secret/totp_enabled/totp_verified_at`: มีครบ
- `users.company_id`: มี
- audit company mappings: **0 unmapped/invalid**
- เนื่องจาก Dev และ production ใช้ฐานข้อมูลเดียวกัน migration ทั้งสามไฟล์จึงถูก apply ไว้แล้วก่อนหน้านี้ (ตรวจยืนยันด้วย query ข้างต้น) — ไม่ต้อง apply เพิ่ม

### Deploy

- local `npm run build`: ผ่าน (exit=0, 94/94 static pages)
- `vercel --prod` (Vercel CLI): สำเร็จ — deployment `micro-business-suite-afscjz0w8-mbs9-c3cc.vercel.app`, alias production `https://micro-business-suite.vercel.app`
- compile 28.3s, deploy โดยไม่ต้อง maintenance window (zero-downtime switch, schema compatible)

### Smoke test หลัง deploy (read-only ทั้งหมด)

- `GET /api/health` → 200 `{"status":"ok","db":"ok"}`
- `GET /login` → 200
- 2FA endpoints มีจริงและบังคับ auth: `setup`→401, `enable`→401, `disable`→401, `verify-login`→400 (bad request body), `status` GET→401 / POST→405
- compat alias `/api/2fa/*` → ทำงาน
- login flow + bcrypt + คอลัมน์ `totp_enabled` ใหม่ทำงานบน deployment ใหม่ (timing delta 104ms หลัง warm)

### สิ่งที่ยังค้าง

- git `main` ยังไม่มีโค้ดชุดนี้ (deploy ผ่าน CLI จาก working tree ที่ยังไม่ commit) — ต้องขออนุมัติ commit+push จากเจ้าของแยกต่างหาก
- แนะนำให้เจ้าของพิจารณาแยกฐานข้อมูล Dev/Production จริงในอนาคต

