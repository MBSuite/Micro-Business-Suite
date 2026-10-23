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
