# AUDIT CHECKLIST — Micro-Business-Suite

**วันที่ตรวจซ้ำ/แก้ไข:** 2026-10-23
**วิธีตรวจ:** อ่านไฟล์จริงใน repository + `git diff` (ไม่เชื่อรายงาน `AUDIT.md` เพียงอย่างเดียว) แล้วรัน typecheck/test
**ขอบเขต:** AUDIT.md Findings AUD-01 ถึง AUD-04

---

## สรุปสถานะ

| ID | รายการ | ตรวจซ้ำแล้ว | แก้ไขแล้ว | หมายเหตุ |
|---|---|---|---|---|
| AUD-01 | Footer ไม่มีข้อความ/ลิงก์ Microtronic | ✅ ยืนยันว่ายังไม่แก้ | ✅ แก้แล้ว 7 ไฟล์ | LandingPage มีทั้งข้อความและลิงก์ |
| AUD-02 | Runtime code ทำ schema changes | ✅ ยืนยันครบ 5 จุด | ✅ แก้ครบ 5 จุด + 6 จุดนอกขอบเขต (รอบ 2) | ไม่เหลือ DDL ใน `app/` และ `lib/` แล้ว |
| AUD-03 | Migration เปลี่ยนชนิดคอลัมน์ใน bootstrap runner | ✅ ยืนยัน | ✅ แก้แล้ว | ถอดออกจาก runner + เพิ่มสคริปต์ตรวจแบบอ่านอย่างเดียว |
| AUD-04 | เอกสารบทบาทไม่ตรงกัน | ✅ ยืนยัน | ✅ แก้แล้ว | `CORE_RULES.md` ตรงกับ `docs/RBAC_STANDARD.md` |

---

## AUD-01 — Footer Microtronic

**ตรวจซ้ำ:** ก่อนแก้ `components/LandingPage.tsx` แสดง `© 2026 Micro-Business-Suite. สงวนลิขสิทธิ์` ไม่มีข้อความหรือลิงก์ตามข้อกำหนด

**แก้ไขแล้ว**

- `components/LandingPage.tsx` — เปลี่ยนข้อความเป็น `Powered by Microtronic © 2026 Microtronic Co., Ltd.` และเพิ่มลิงก์ `https://microtronic.biz/` (`target="_blank"` + `rel="noopener noreferrer"`)
- เปลี่ยนข้อความ footer ให้ตรงกันอีก 6 ไฟล์:
  - `app/login/page.tsx`
  - `app/settings/page.tsx`
  - `app/vouchers/page.tsx`
  - `app/inventory/new/page.tsx`
  - `app/inventory/edit/[id]/EditProductClient.tsx`
  - `app/admin/members/new/page.tsx`

**ยืนยัน:** `grep "Powered by Microtronic"` พบครบ 7 ไฟล์
**ไม่ได้แก้:** `app/admin/members/page.tsx:297` (`© 2026 Control Panel v1.0`) — เป็นป้ายชื่อ Control Panel ไม่ใช่ copyright footer ของผลิตภัณฑ์

---

## AUD-02 — ย้าย schema changes ออกจาก runtime

**ตรวจซ้ำ:** พบครบตามรายงานทั้ง 5 จุด

**แก้ไขแล้ว — runtime ไม่สร้าง/แก้ schema อีกต่อไป**

| ไฟล์ | เดิม | ใหม่ |
|---|---|---|
| `lib/auth.ts` | `CREATE TABLE companies` + `ALTER TABLE users ADD COLUMN company_id` | ตรวจ `information_schema` ว่ามีตาราง/คอลัมน์ ถ้าไม่มี throw error พร้อมบอกให้รัน bootstrap (ตรรกะสร้างบริษัทเริ่มต้นยังอยู่) |
| `lib/settings.ts` | `CREATE TABLE company_settings` + seed row | ตรวจว่ามีตาราง คืน `boolean`; `getCompanySettings`/`updateCompanySettings` คืน error message ถ้า schema ขาด |
| `lib/payroll.ts` | `CREATE TABLE payroll_entries` + index | ตรวจว่ามีตาราง คืน `boolean` |
| `lib/module-config.ts` | `CREATE TABLE company_module_settings` | ตรวจว่ามีตาราง คืน `boolean`; ตัวอ่าน/เขียน overrides throw error ถ้า schema ขาด |
| `lib/actions-helpers.ts` | `ALTER TABLE contacts ADD contact_type` + backfill | ตรวจว่ามีคอลัมน์ คืน `boolean` |

**Callers ที่ปรับให้จัดการ schema ที่ขาด**

- `app/actions/contacts.ts` — คืน `{ success:false, error }`
- `app/api/contacts/route.ts` — ลบฟังก์ชัน DDL ที่ประกาศซ้ำในไฟล์ และคืน 500 พร้อมข้อความ
- `app/api/payroll/route.ts` (GET + POST) — คืน 500 พร้อมข้อความ
- `app/api/payroll/[id]/route.ts` — คืน 500 พร้อมข้อความ

**Migration ที่เพิ่ม (รันผ่าน bootstrap ตามลำดับ)**

1. `migrations/add_companies_table.sql`
2. `migrations/add_users_company_id_column.sql`
3. `migrations/add_company_settings_table.sql` (รวม seed row แบบ idempotent)
4. `migrations/add_company_module_settings_table.sql`
5. `migrations/add_contacts_contact_type_column.sql` (รวม backfill แบบ idempotent)
6. `migrations/add_expenses_columns.sql` (รอบ 2)
7. `migrations/add_payments_invoices_columns.sql` (รอบ 2)
8. `migrations/add_recurring_billing_schema.sql` (รอบ 2)
9. `migrations/add_payroll_entries_table.sql` — มีอยู่เดิมแล้ว ใช้ไฟล์เดิม ไม่สร้างซ้ำ

**Bootstrap runner:** เพิ่ม 8 ไฟล์ใหม่ใน `scripts/bootstrap-init-db.mjs` โดยวาง `add_companies_table.sql` และ `add_users_company_id_column.sql` ก่อน `add_company_tenant_scope.sql`

**ยืนยัน:** `grep "CREATE TABLE|ALTER TABLE|ADD COLUMN"` ใน `lib/` ไม่พบ DDL เหลืออยู่

### แก้เพิ่มเติม — runtime DDL นอกขอบเขต AUD-02 (6 จุด)

การค้นซ้ำพบ schema change ใน runtime อีก 6 จุดที่รายงานตรวจครั้งแรกไม่ได้ระบุ — **แก้ครบทั้ง 6 จุดแล้ว** (รอบที่ 2, 2026-10-23)

| ไฟล์ | เดิม | ใหม่ |
|---|---|---|
| `app/expense-actions.ts` | `CREATE TABLE expenses` + `ALTER TABLE ... ADD COLUMN` 17 คอลัมน์ | `ensureExpensesSchema()` ตรวจ 5 คอลัมน์สำคัญ; ทั้ง 5 callers คืน `{ success:false, error }` ถ้า schema ขาด |
| `app/register/db-init.ts` | `CREATE TABLE users` + `ALTER TABLE users ADD COLUMN` | ตรวจตาราง/คอลัมน์แบบอ่านอย่างเดียว คืน error บอกให้รัน bootstrap (ไม่สร้าง/แก้ตาราง) |
| `app/recurring/page.tsx` | `ALTER TABLE recurring_invoices` + backfill `billing_day` | เรียก `ensureRecurringBillingSchema()` แล้ว `console.warn` ถ้า schema ไม่ครบ (ไม่บล็อกหน้า) |
| `app/api/recurring/generate/route.ts` | `ALTER TABLE recurring_invoices` + `CREATE TABLE subscription_invoices` + index | เรียก helper เดียวกัน และคืน 500 พร้อมข้อความถ้า schema ขาด |
| `app/api/migrate/route.ts` | `ALTER TABLE quotations ADD COLUMN` (2 คอลัมน์) | เปลี่ยนเป็น endpoint **read-only** รายงานสถานะคอลัมน์ (200 = ครบ, 409 = ขาด พร้อมบอกให้รัน bootstrap) |
| `app/actions/vouchers.ts` | `ALTER TABLE payments` 10 คอลัมน์ + `ALTER TABLE invoices ADD is_service` | ตรวจ 11 คอลัมน์ก่อน `BEGIN`; คืน error ถ้า schema ขาด |

**ไฟล์/สคริปต์ที่เพิ่มในรอบนี้**

- `lib/recurring-schema.ts` — helper ตรวจ schema ของ recurring billing ใช้ร่วมกัน 2 จุด
- `migrations/add_expenses_columns.sql`
- `migrations/add_payments_invoices_columns.sql`
- `migrations/add_recurring_billing_schema.sql` (รวม backfill + `subscription_invoices` + unique index)

**ปรับ bootstrap runner เพิ่ม**

- เพิ่ม migration ใหม่ 3 ไฟล์ข้างต้นใน `FILES`
- เพิ่ม migration ที่มีอยู่แล้วแต่ยังไม่ถูกเรียก: `add_company_tenant_scope_quotations_expenses.sql`, `add_company_tenant_scope_payment_vouchers.sql`, `add_company_tenant_scope_master_tables.sql` (ตัวสุดท้ายวางหลัง `add_services_table.sql` เพราะอ้างตาราง `services`)

**ปรับ UI ให้ตรงพฤติกรรมใหม่**

- `app/register/page.tsx` — เปลี่ยนข้อความปุ่มจาก "ซ่อมแซม/แก้ตารางใน Neon" เป็น "ตรวจสอบโครงสร้างตาราง users" พร้อมข้อความผลลัพธ์ที่ตรงกับสิ่งที่ทำจริง

**ยืนยัน:** `grep -rn "CREATE TABLE|ALTER TABLE|ADD COLUMN" app lib --include=*.ts --include=*.tsx` → **ไม่พบ DDL เหลืออยู่ใน runtime เลย**

---

## AUD-03 — Migration เปลี่ยนชนิดคอลัมน์

**ตรวจซ้ำ:** `migrations/fix_column_types_date_timestamp.sql` มี `ALTER COLUMN ... TYPE` 3 คำสั่ง (`expenses.expense_date`, `invoices.created_at`, `payment_vouchers.issue_date`) และถูกระบุใน `FILES` ของ `scripts/bootstrap-init-db.mjs` จริง

**แก้ไขแล้ว**

- ถอด `migrations/fix_column_types_date_timestamp.sql` ออกจาก `FILES` ของ `scripts/bootstrap-init-db.mjs` พร้อมคอมเมนต์อธิบายเหตุผล
- เพิ่มหัวไฟล์ของ migration ระบุ **MANUAL ONLY — ไม่อยู่ใน bootstrap runner** และเงื่อนไขก่อนรัน (ตรวจชนิดข้อมูล → ประเมินผลกระทบ → อนุมัติ)
- เพิ่ม `scripts/check-column-types.mjs` — สคริปต์ **อ่านอย่างเดียว** ตรวจ `information_schema` ของ 3 คอลัมน์ target, exit code 0 = ตรงแล้ว, 1 = ต้องตรวจ, 2 = เชื่อมต่อไม่ได้
- เพิ่ม npm script: `check:column-types`

**ยังไม่ได้ทำ:** ยังไม่ได้เชื่อมต่อฐานข้อมูลใด ๆ เพื่อยืนยันชนิดคอลัมน์จริง (ไม่มี/env ไม่ได้เปิดเผย `DATABASE_URL`) — ต้องรัน `npm run check:column-types` บนฐานข้อมูลเป้าหมายก่อนตัดสินใจ

---

## AUD-04 — เอกสารบทบาท

**ตรวจซ้ำ:** `CORE_RULES.md` เดิมระบุ users อนุญาตเฉพาะ `superadmin`, `admin` แต่ค่า default เป็น `user` ขัดกับ `docs/RBAC_STANDARD.md`

**แก้ไขแล้ว**

- `CORE_RULES.md:90` → `**Purpose:** System users with role-based access control. Allowed roles: superadmin, admin, and user.`
- `CORE_RULES.md:97` (คอมเมนต์ใน DDL) ระบุ `(superadmin, admin, user)` ตรงกับ canonical roles แล้ว

**ยืนยัน:** canonical roles ทั้งสามตรงกับ `docs/RBAC_STANDARD.md:5-9`

---

## ผลการตรวจอัตโนมัติหลังแก้ไข

| คำสั่ง | ผล |
|---|---|
| `./node_modules/.bin/tsc --noEmit` | ✅ ผ่าน ไม่มี error |
| `node --test tests/**/*.test.mjs` | ✅ ผ่าน 8, ไม่ผ่าน 0, ข้าม 6 (เท่า baseline เดิม) |
| `pnpm lint` | ⚠️ ไม่ได้รัน — `pnpm` ไม่มีใน environment นี้ และ baseline เดิมล้มอยู่แล้ว (331 errors / 152 warnings) |

---

## ผลการรัน bootstrap กับ Neon `neondb` (production) — 2026-10-23

- คำสั่ง: `node scripts/bootstrap-init-db.mjs` (เวอร์ชันที่ปรับให้เหมาะกับ DB ที่มีอยู่แล้ว)
- ผล: **25 ok, 1 skipped (backup.sql), 0 failed / 26 total**
- ข้าม: `scripts/backup.sql` (existing database detected)
- migration ที่ล้มก่อนหน้า (`add_company_settings_table.sql`) แก้แล้วและรันผ่านในรอบนี้

## ผล `npm run check:column-types` กับ Neon `neondb`

- `expenses.expense_date` = date ✅
- `invoices.created_at` = timestamp without time zone ✅ (แปลงแล้วจาก timestamptz โดย `fix_column_types.sql`)
- `payment_vouchers.issue_date` = date ✅
- สรุป: 3/3 คอลัมน์ตรงทั้งหมด, 0 ต้องตรวจ, 0 ไม่พบ

## AUD-03 — สถานะหลังรันจริง

- `migrations/fix_column_types_date_timestamp.sql` ยัง **ไม่ถูกเรียก** โดย bootstrap (ตามที่ตั้งใจ)
- แต่ `migrations/fix_column_types.sql` (ที่อยู่ใน runner) รันสำเร็จแล้ว และแปลง `invoices.created_at` จาก `timestamptz` → `timestamp` บน Neon จริงแล้ว
- ชนิดคอลัมน์ทั้ง 3 ตัวตรงกับที่ `check-column-types.mjs` คาดไว้แล้ว

## สิ่งที่ต้องทำต่อ (อัปเดต)

1. ✅ รัน `node scripts/bootstrap-init-db.mjs` กับ Neon `neondb` — ผ่าน (25 ok / 0 failed)
2. ✅ รัน `npm run check:column-types` — 3/3 ตรง
3. ทดสอบ manual: settings, payroll (GET/POST), contacts, module overrides, expenses (list/create/edit/delete), payments, recurring billing, quotation recurring columns, register page
4. ตรวจสอบผลกระทบจากการแปลง `invoices.created_at` จาก `timestamptz` → `timestamp` (โค้ดที่คาดหวัง timezone อาจต้องปรับ)
5. ยังไม่ commit / ยังไม่ push — รอคำสั่ง

## ประวัติการแก้ไข

- รอบที่ 1 (2026-10-23): AUD-01, AUD-04 + AUD-02 5 จุดตามรายงาน + AUD-03
- รอบที่ 2 (2026-10-23): runtime DDL นอกขอบเขต AUD-02 อีก 6 จุด (expenses, register/users, recurring ×2, quotations migrate endpoint, payments/invoices) + เชื่อม tenant-scope migrations ที่ค้างอยู่เข้า bootstrap runner

