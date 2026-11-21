# Micro-Business-Suite Audit

> **สถานะการแก้ไขล่าสุด (2026-10-23):** ดู `AUDIT-CHECKLIST.md` — AUD-01, AUD-02, AUD-03, AUD-04 ตรวจซ้ำและแก้ไขแล้ว (รายละเอียด/ข้อค้างอยู่ในไฟล์นั้น)

**ตรวจเมื่อ:** 2026-10-23  
**ขอบเขต:** ตรวจเอกสารข้อกำหนดหลักและจุดเชื่อมโยงใน source code, footer, database schema/migrations, authentication, tests, lint และ TypeScript  
**ประเภทการตรวจ:** ตรวจจาก repository ในเครื่อง ไม่ได้เชื่อมต่อฐานข้อมูล production หรือยืนยันสถานะ deployment

## สรุปผล

**สถานะ: ยังไม่ผ่านข้อกำหนดทั้งหมด — ควรแก้รายการในหัวข้อ Findings ก่อน sign-off**

## Findings

### AUD-01 — Footer ไม่มีข้อความและลิงก์ Microtronic ตามข้อกำหนด

- **ระดับ:** ต้องแก้
- **หลักฐาน:** `components/LandingPage.tsx:167-170` แสดง `© 2026 Micro-Business-Suite. สงวนลิขสิทธิ์`
- **ข้อกำหนด:** Footer ต้องมีข้อความ `Powered by Microtronic © 2026 Microtronic Co., Ltd.` และลิงก์ไป `https://microtronic.biz/`
- **ผล:** ข้อความที่กำหนดและลิงก์ไม่ปรากฏใน footer ที่ตรวจ
- **แนวทางปรับปรุง:** เพิ่มข้อความและลิงก์ตามข้อกำหนด แล้วตรวจว่าหน้า/จุดที่มี footer อื่นใช้ข้อความเดียวกันตามความเหมาะสม

### AUD-02 — Runtime code ทำ schema changes โดยตรง

- **ระดับ:** ต้องทบทวนแนวทาง
- **ข้อกำหนด:** `CORE_RULES.md` ระบุให้ schema changes ใช้ migration scripts
- **หลักฐานที่พบ:**
  - `lib/auth.ts:38,52` สร้าง `companies` และเพิ่ม `users.company_id`
  - `lib/settings.ts:46` สร้าง `company_settings`
  - `lib/payroll.ts:5` สร้าง `payroll_entries`
  - `lib/module-config.ts:5` สร้าง `company_module_settings`
  - `lib/actions-helpers.ts:28` เพิ่ม `contacts.contact_type`
- **ผล:** โค้ดเหล่านี้มีการเปลี่ยน schema ระหว่างการทำงานของแอป ซึ่งไม่ตรงกับแนวทาง migration ในเอกสาร
- **แนวทางปรับปรุง:** ย้ายการจัดการ schema ไปยัง migration/bootstrap ที่ควบคุมลำดับและผลลัพธ์ได้ และให้ runtime ตรวจ/รายงาน schema ที่ขาดโดยไม่แก้ schema เอง

### AUD-03 — มี migration เปลี่ยนชนิดคอลัมน์และอยู่ใน bootstrap runner

- **ระดับ:** ต้องตรวจยืนยันก่อนใช้กับ production
- **ข้อกำหนด:** `CORE_RULES.md` ห้ามเปลี่ยนชนิดคอลัมน์ที่มีอยู่ใน production tables
- **หลักฐาน:** `migrations/fix_column_types_date_timestamp.sql:19,23,27` เปลี่ยนชนิดคอลัมน์ `expenses.expense_date`, `invoices.created_at` และ `payment_vouchers.issue_date`; `scripts/bootstrap-init-db.mjs:31` ระบุ migration นี้ในรายการที่ runner ประมวลผล
- **ผล:** มีเส้นทางที่อาจนำคำสั่งเปลี่ยนชนิดคอลัมน์ไปรันกับฐานข้อมูลที่กำหนดใน `DATABASE_URL` ได้
- **ข้อจำกัด:** การตรวจ repository นี้ยืนยันได้เพียงว่า runner มี migration ดังกล่าว ไม่ได้ยืนยันว่าเคยรันกับ production แล้ว
- **แนวทางปรับปรุง:** ตรวจสถานะและชนิดข้อมูลในฐานข้อมูลเป้าหมายก่อนดำเนินการใด ๆ; อย่ารัน bootstrap runner กับ production จนกว่าจะประเมินผลกระทบและอนุมัติแนวทาง

### AUD-04 — เอกสารกำหนดบทบาทไม่ตรงกัน

- **ระดับ:** ต้องปรับเอกสารให้เป็นมาตรฐานเดียว
- **หลักฐาน:**
  - `CORE_RULES.md:90` ระบุว่า users อนุญาตเฉพาะ `superadmin` และ `admin`
  - `CORE_RULES.md:97` กำหนดค่าเริ่มต้นเป็น `user`
  - `docs/RBAC_STANDARD.md:5-9` ระบุ `superadmin`, `admin` และ `user` เป็น canonical roles
- **ผล:** ข้อกำหนดเรื่องบทบาทผู้ใช้ขัดแย้งกัน ทำให้การตรวจความถูกต้องของระบบและการ sign-off ไม่มีเกณฑ์เดียว
- **แนวทางปรับปรุง:** ยืนยันนโยบายที่ต้องการ แล้วปรับ `CORE_RULES.md` ให้สอดคล้องกับ `docs/RBAC_STANDARD.md` หรือแก้ทั้งสองเอกสารให้ใช้ข้อกำหนด canonical เดียวกัน

## สิ่งที่ตรวจแล้วผ่าน

- รูปแบบ authentication ที่ค้นพบสอดคล้องกับ `AUTH_RULES.md`: ใช้ `proxy.ts`, `jose`, `bcryptjs` และ cookie `session-token` ที่กำหนด `httpOnly`, `sameSite: "lax"` และ `secure` เมื่อเป็น production
- จากการค้นหา source ที่ตรวจ ไม่พบการใช้ `next-auth`, `next-auth/react`, `useSession()` หรือ `middleware.ts`
- TypeScript check ผ่าน

## ผลการตรวจอัตโนมัติ

| คำสั่ง | ผล |
|---|---|
| `pnpm test` | ผ่าน 8, ไม่ผ่าน 0, ข้าม 6 |
| Integration security tests | ข้าม 6 รายการ เนื่องจากไม่มี `MBS_TEST_BASE_URL`, `MBS_TEST_DATABASE_URL` และ `MBS_TEST_JWT_SECRET` |
| `pnpm lint` | ไม่ผ่าน: 331 errors และ 152 warnings |
| `pnpm exec tsc --noEmit` | ผ่าน |
| Production build | ไม่ได้รันในการตรวจครั้งนี้ |

Lint รายงานผลทั้ง repository; ยังไม่ได้แยกว่ามีรายการใดเป็น baseline เดิมหรือเกิดจากการเปลี่ยนแปลงล่าสุด

## สถานะ worktree ระหว่างตรวจ

ก่อนและหลังตรวจ พบ `next-env.d.ts` เป็นไฟล์ modified ใน worktree ของโครงการ ไฟล์นี้ไม่ได้ถูกแก้ไขเพื่อจัดทำรายงานนี้

## ข้อจำกัด

- ไม่ได้เชื่อมต่อหรือตรวจข้อมูลในฐานข้อมูล production
- ไม่ได้ยืนยันว่า migrations ที่กล่าวถึงถูกรันบน production แล้วหรือไม่
- ไม่ได้รัน integration tests เพราะไม่มี test endpoint/database/secret สำหรับทดสอบ
- รายงานนี้เป็นการตรวจความสอดคล้องกับข้อกำหนดและคุณภาพเบื้องต้น ไม่ใช่ security review เต็มรูปแบบหรือการรับรอง production readiness

## การตรวจรอบ 2026-11-21 (จุดตั้งต้น: `SECURITY.md`)

ขอบเขต: ตรวจแบบ read-only เทียบ `SECURITY.md` กับโค้ด auth/API/migration/test/เอกสาร แล้วปรับปรุงโค้ดและเอกสารที่ไม่ตรงตามมาตรฐานที่ระบุไว้ **ไม่มีการเชื่อมฐานข้อมูลจริง ไม่ได้ apply migration ไม่ได้ deploy ไม่ได้แก้ `.env`**

### รายการที่ปรับแล้ว

| รหัส | ระดับก่อนแก้ | สิ่งที่พบ | การปรับปรุง |
|---|---|---|---|
| SEC-01 | สูง | `app/api/payments/[id]/route.ts` ลบ journal ด้วย `reference_no LIKE '%RC-<id>%'` ไม่ผูก tenant และ `BEGIN/COMMIT` ผ่าน `pool.query` คนละ connection | ลบด้วย `reference_type='receipt' AND reference_id=$1 AND company_id=$2` ใน client เดียว ล็อกแถวด้วย `FOR UPDATE` |
| SEC-02 | สูง | `bridge_sync_log.idempotency_key` UNIQUE ทั้งตาราง และ route ค้นด้วย key เดียว → ข้าม tenant ได้ | migration 	new `add_bridge_sync_tenant_scope.sql` + query scoped ตาม `(company_id, idempotency_key)` + รองรับ unique race |
| SEC-03 | สูง | `forgot-password` พิมพ์ reset URL ลง log; reset token ใช้ซ้ำได้; session เก่ายังใช้ได้หลังเปลี่ยนรหัสผ่าน | ลบการ log link, jti ledger แบบใช้ครั้งเดียว, `users.password_changed_at` + ตรวจใน `auth()` |
| SEC-04 | สูง (ข้อมูล) | backup `SELECT *` redact เฉพาะ `users.password`; encryption เป็น optional | redact ทุกคอลัมน์ที่ตรง pattern ความลับ (RD/OAuth/2FA/license/credentials) ก่อนส่งออก |
| SEC-05 | กลาง | recovery code ถูก `SELECT` แล้ว `UPDATE` คนละคำสั่ง (verify-login และ disable) | `UPDATE ... WHERE id = (SELECT ... FOR UPDATE SKIP LOCKED) RETURNING id` แบบ atomic |
| DOC-01 | กลาง | `API_ACCESS_MATRIX.md` ระบุ payment scope ยังรอ, backup ใช้ `canAccessAdmin()`, system-audit ไม่มี auth guard — ไม่ตรงโค้ด | อัปเดตตารางให้ตรงโค้ดปัจจุบัน |
| DOC-02 | ปิดแล้ว | แก้ข้อความที่ระบุผู้ให้บริการฐานข้อมูลผิดในเอกสารให้ชี้ Gate 3 (Neon เป็นเป้าหมายจริงของ Production) | อัปเดต `SECURITY.md`, `README.md`, `ARCHITECTURE.md`, `PRODUCTION_CHECKLIST.md`, `VERCEL_ENV_CHECKLIST.md`, `MODULE_MIGRATION_RUNBOOK.md`, `PRODUCTION_MIGRATION_RUNBOOK.md` ให้ชี้ Gate 3 เป็นความจริงล่าสุด |

### สิ่งที่ยังเป็นความเสี่ยง/ต้องทำก่อน deploy

- **ต้องตรวจเป้าหมาย live อีกครั้งก่อน migration/deploy** — เอกสารและหลักฐาน Gate 3 ไม่ตรงกันเรื่อง provider ของ Production; ต้อง owner ยืนยันและสำรองข้อมูลก่อน
- `MBS_BRIDGE_TOKEN` ที่ใช้ร่วมหลายโมดูลยังส่ง `company_id` เองได้ — แนะนำออก token แยกต่อโมดูล/tenant (ต้องเปลี่ยน env → ต้อง owner ทำเอง)
- `system-audit?test=database` ยังไม่มีหลักฐานว่ากรองข้อมูลข้ามบริษัท — เปิดเฉพาะ dev
- rate limit ยังเก็บใน memory ของ instance (`lib/rate-limit.ts`, `proxy.ts`) ไม่สม่ำเสมอใน serverless หลาย instance
- integration regression 5 รายการใน `tests/security-hardening.test.mjs` ยัง **skip** อยู่เพราะไม่มี disposable `MBS_TEST_*` — ต้องรันบนฐานทิ้งได้ก่อนถือว่าผ่าน
- ยังไม่ได้ scan dependency/`npm audit` และไม่ได้รัน production build ในการตรวจรอบนี้

### ผลการตรวจอัตโนมัติรอบนี้

| คำสั่ง | ผล |
|---|---|
| `pnpm exec tsc --noEmit` | ผ่าน |
| `pnpm exec eslint` (เฉพาะไฟล์ที่แก้) | ผ่าน 0 error |
| `pnpm test` | `node:test` ผ่าน 41, skip 20, fail 0 · TS unit ผ่าน 29, fail 0 |
| `node --check` (scripts ที่แก้) | ผ่าน |
| `pnpm build` | ผ่าน (Compiled successfully, 95 static pages) |
