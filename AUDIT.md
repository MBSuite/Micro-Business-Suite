# Source Audit — Micro-Business-Suite (Core)

**วันที่อัปเดต:** 2026-11-09
**ขอบเขต:** source review และ automated checks บนฐาน PostgreSQL แบบ disposable
**ผลทดสอบ Dev/Production:** ไม่ได้ทดสอบบน Dev หรือ Production และไม่สามารถยืนยันการทำงานของสอง environment นี้ได้

## สรุป

Core ไม่มีระบบ SSO ข้ามแอป: endpoint ออก token/JWKS, callback และ allowlist ถูกถอดออกจาก source แล้ว และหน้า login รับเฉพาะอีเมล/รหัสผ่านของ Core เอง ส่วน webhook replay และ company fallback ได้รับการแก้ใน source และทดสอบบนฐาน disposable แล้ว แต่ Dev signup/delete, 2FA และ Production acceptance ยังไม่ผ่านการยืนยัน

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
