# Backlog (Micro Business Suite)

รายการงานค้างที่ตรวจสอบแล้วจริง (probe/grep จากโค้ดจริง ไม่ใช่การเดา) —
เรียงตามลำดับความสำคัญคร่าวๆ อัปเดตล่าสุด: 2026-11-21

> หมายเหตุ: เนื้อหานี้เป็นรายงานข้อเท็จจริง + แนวทางแนะนำ — ยังไม่ได้รับอนุมัติให้ลงมือทำ
> เริ่มงานแต่ละรายการเมื่อพี่ (เจ้าของ) สั่งเท่านั้น

---

## 🆕 License: AUDIT tier + is_audit (2026-11-21)

**สถานะ:** PRD/Spec + SQL migration + โค้ด TS ใน Core เสร็จแล้ว — **ยังไม่ได้รัน migration บน production และยังไม่ได้ deploy**

- PRD/Spec (แอพ User & License Management): `../Micro-Business-Admin/docs/PRD-user-license-management.md`
- Migration (idempotent, additive): `migrations/mbs_core_add_audit_license.sql`
  - `companies.is_audit BOOLEAN NOT NULL DEFAULT FALSE` + partial index + COMMENT บน `plan_type`
  - ไม่มี CHECK constraint เดิมบน `plan_type` → ไม่ต้อง alter constraint
  - ลงทะเบียนใน `scripts/bootstrap-init-db.mjs` (`FILES`) แล้ว
- ✅ เสร็จแล้ว: `"AUDIT"` ใน `lib/license.ts` (type + `LICENSE_TYPES` + `is_audit?` + validation กัน `is_audit=true` บน tier อื่น) และ `lib/license-packages.ts` (tier matrix 5/2000 + `audit_mode` + `isAudit` flag) — ตรวจด้วย `tsc --noEmit` + 12 กรณี behavioral test ผ่าน
- ยังค้าง: ปรับ admin license route ให้บังคับ superadmin + เซ็ต `is_audit: true` ใน payload ตอนออก AUDIT (ตอนนี้ payload ยังไม่มี field นี้ → ต้องทำก่อนบังคับกฎ reverse `AUDIT ⇒ is_audit=true`), ออก subscription license ตอน signup ตรงผ่าน Bridge, หน้า UI ในแอพ admin
- หมายเหตุ `KNOWN_FEATURES`: มี `export const KNOWN_FEATURES` ใน `lib/license-packages.ts` (whitelist 7 ฟีเจอร์ รวม `audit_mode`) สำหรับฝั่ง Admin app; ส่วน `app/api/admin/customers/[id]/license/route.ts` ยัง derive รายการของตัวเองจาก `Object.values(LICENSE_PACKAGES).flatMap(p => p.defaultFeatures)` ตาม `LICENSE_STANDARD.md` §8.3 → `audit_mode` เข้ารวมโดยอัตโนมัติ (ทดสอบแล้ว) — whitelist ใหม่ไม่รวม `multi_company`/`api_access`/`custom_branding` ถ้า Admin app เปลี่ยนไป import ต้องขยายรายการด้วย
- **Production:** ต้อง backup + อนุมัติจากพี่ฆังก่อนรัน migration เสมอ (ดู `MODULE_MIGRATION_RUNBOOK.md`)

## ✅ Implemented (rounds 1-3, 2026-11-05)

- POS คิดเงินด่วน (`/pos`) + barcode scan + multi-payment + stock deduction
- วิเคราะห์ยอดขาย (`/reports/sales-analytics`)
- โปรโมชัน/ส่วนลด (`/promotions`) rules engine + apply ที่ POS
- CRM/สะสมคะแนน (`/crm`) + auto-accrual ที่ POS
- หลายสาขา (`/branches`) + branch selector ที่ POS
- F&B (`/fb`) ผังโต๊ะ/KOT/บิล
- เชื่อมต่อ E-commerce/Delivery (`/integrations/*`) + webhook import
- จัดการปลักอิน/Add-on (`/admin/plugins`) — installable packs
- Migrations: branches, product_variants, loyalty, promotions, branch_stock, fb_*, integration_connections
- MBSuite = Core (core:true) vs plugin modules (core:false) ใน module-registry

## ยังค้าง (Pending)

- inventory_variants: UI จัดการสี/ไซส์/ประเภท (มี migration แล้ว, scaffold page)
- employee_sales: ยอดขายรายพนักงาน (scaffold)
- offline_mode: sync offline (scaffold)
- P1-P4 ด้านล่าง (cross-company leak, rebrand, IDOR, vouchers API)

## P1 — Dashboard อ่านข้อมูลข้ามบริษัท (cross-company leak)

**สถานะ:** แก้ใน code แล้ว (query มี company scope แล้ว) — ต้อง sync integration test/harness ก่อนปิดงาน

**ข้อเท็จจริง (ตรวจสอบแล้ว):**
- `app/page.tsx:38` `getDashboardData()` รัน query โดยไม่มี company filter:
  - `expenses` — `app/page.tsx:54` (`WHERE expense_date >= $1` เท่านั้น)
  - `journal_entries` — `app/page.tsx:69`, `:86`, `:113`
  - `invoices` — `app/page.tsx:106`, `:111`
  - `users` (Pending) — `app/page.tsx:125`
  - `contacts` (customer count) — `app/page.tsx:143`
- `app/actions/settings.ts:76` `getDashboardAlerts()` ดึง `reminders` (`:78`) + unpaid `invoices` (`:79`) `LIMIT 5` จากทุกบริษัท

**จุดกำบัง (blocker):**
- `journal_entries` ยังไม่มี column `company_id` (ต้อง probe schema จริงก่อนคิด migration —
  ตอนนี้ `app/expense-actions.ts:12` ลบ journal ด้วย `reference_type/reference_id` ซึ่งเป็นวิธีแก้ชั่วคราว)
- `reminders` / `chart_of_accounts` ต้อง probe ว่ามี company scope หรือไม่

**แนวทางแนะนำ:**
1. Probe schema จริงของ `journal_entries`, `reminders` (lib/db.ts + prod)
2. เพิ่ม migration `company_id` (idempotent, guarded FK, backfill จาก reference invoice/expense ของบริษัท)
3. Filter ทุก query ใน `getDashboardData()` + `getDashboardAlerts()` ด้วย session company
4. เพิ่มการ์ด `journal_entries`/`reminders` ใน harness schema + เพิ่ม integration test

---

## P2 — เปลี่ยนโลโก้ + ชื่อแอพอย่างเป็นทางการ "Micro-Business-Suite"

**สถานะ:** ค้าง/เลื่อน (พี่สั่งปล่อยไปก่อน 2026-09-25 — ค่อยกลับมาแก้ภายหลัง)

**Decision ที่พี่กำหนดไว้แล้ว:**
- โลโก้ทางการ = `public/Gemini_Generated_Image_myw1u2myw1u2myw1 (1).png`
- ขอบเขตชื่อ = ทุกจุดที่ user เห็น เท่านั้น (ไม่รวม code comment / docs/*)

**ข้อเท็จจริง (ตรวจสอบแล้ว):**
- ชื่อปัจจุบัน "Micro Business Suite" (มี space) ปรากฏ ~30 จุด user-visible:
  - หลัก: `app/layout.tsx:11` title, `components/Sidebar.tsx:128` + `:166`, `app/login/page.tsx:134`
  - Footer/copyright หน้า UI ~15 หน้า (vouchers, quotations, invoices, journals, inventory, contacts, receipts,
    expenses, accounting/reconciliation, settings, admin/members, admin/backup, admin/permissions, dashboard)
  - print: `app/invoices/preview/[id]/page.tsx` (brand + `/Untitled-10.png`), `app/page.tsx:413`
  - Google Drive: `app/actions/google-drive.ts` (Documents/Reports folder + sheet title), `app/actions/tax-reports.ts:212`
  - seed default: `lib/settings.ts:48` + `:65` (company_name "Micro Business Suite")
- `/Untitled-10.png` ใช้เฉพาะ invoice print; `Gemini_Generated_Image... (1).png` ยังไม่ถูกใช้ที่ไหน; ไม่มี favicon/icon

**แนวทางแนะนำ:**
1. copy โลโก้ → `app/icon.png` (favicon) + `public/logo.png` (path สะอาด) นำเข้า Sidebar/login/invoice print
2. แทนที่ทุกจุด user-visible ตามรายการด้านบนเป็น "Micro-Business-Suite"
3. เปลี่ยน Google Drive folder name ให้ใช้งานชื่อใหม่ (หมายเหตุ: folder เดิมที่สร้างไปแล้วจะไม่ slice — สร้างใหม่/rename ตามนโยบาย)
4. เปลี่ยน seed company_name เฉพาะค่า default ใหม่ (ข้อมูลบริษัทเดิมที่ insert ไปแล้วไม่ touch)

---

## P3 — IDOR หน้าอ่าน/แก้ invoices & expenses ตาม id

**สถานะ:** แก้ใน code แล้ว (invoices list + edit/preview/wht50/expenses อิง `company_id` ผ่าน migration + query filter) — รอ sync integration test/harness ก่อนปิดงาน

**ข้อเท็จจริง (ตรวจสอบแล้ว — จุดที่ยัง query โดยไม่ filter company):**
- `app/invoices/page.tsx:20` — รายการ invoices
- `app/invoices/edit/[id]/page.tsx:11`
- `app/invoices/preview/[id]/page.tsx:15`
- `app/invoices/wht50/[id]/page.tsx:15`
- `app/expenses/[id]/wht53/page.tsx:15`

**แนวทางแนะนำ:**
- ทำตาม pattern ที่ปิด quotations แล้ว (WS-3 #4): `auth()` → `getUserCompanyId()` →
  `WHERE i.company_id = $n`
- ตรวจ/api route ที่เกี่ยวข้องด้วย (`app/api/invoices/delete/route.ts`) ว่ามี company check
- หา caller ทุกจุดก่อนแก้ (บางหน้าเรียก server action ที่ filter ไปแล้วก็ไม่ต้องซ้ำ)

---

## P4 — หน้า vouchers list เชื่อม API ที่ไม่มีอยู่ (dead-end)

**สถานะ:** แก้แล้ว — สร้าง `app/api/vouchers/route.ts` (GET, session + company filter, เรนด์จาก `getPaymentVouchers`) แล้ว ✅

**ข้อเท็จจริง (ตรวจสอบแล้ว):**
- `app/vouchers/page.tsx:123` `fetch('/api/vouchers')`
- `app/api/**/route.ts` ไม่มี route `vouchers` (glob แล้ว)
- ผล: `res.ok === false` → `setLoading(false)`, `vouchers` คง `[]` → หน้าไม่โชว์รายการ

**แนวทางแนะนำ:**
- ตัวเลือก ก: สร้าง `app/api/vouchers/route.ts` (GET, session + company filter, ใช้ `getPaymentVouchers`)
- ตัวเลือก ข: refactor หน้าเป็น server component อ่านผ่าน action โดยตรง (ไม่มี API กลาง)

---

## สถานะงานที่ปิดไปแล้ว (context สำหรับการดูแลต่อ)

- commit `c2711ce` — `feat(gating): tenant-scope payment_vouchers and close company data leaks`
  (WS-3 #5): payment_vouchers.company_id + tax-reports/rd-api scope + aiAudit superadmin-gate +
  quota รวม vouchers + Google Drive export/Profit & Loss filter + harness 6/6
- commit `031c6ce` — `feat(gating): tenant-scope quotations and expenses to company` (WS-3 #4)