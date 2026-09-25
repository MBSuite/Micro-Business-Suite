# Backlog (Micro Business Suite)

รายการงานค้างที่ตรวจสอบแล้วจริง (probe/grep จากโค้ดจริง ไม่ใช่การเดา) —
เรียงตามลำดับความสำคัญคร่าวๆ อัปเดตล่าสุด: 2026-09-25

> หมายเหตุ: เนื้อหานี้เป็นรายงานข้อเท็จจริง + แนวทางแนะนำ — ยังไม่ได้รับอนุมัติให้ลงมือทำ
> เริ่มงานแต่ละรายการเมื่อพี่ (เจ้าของ) สั่งเท่านั้น

---

## P1 — Dashboard อ่านข้อมูลข้ามบริษัท (cross-company leak)

**สถานะ:** เปิดอยู่ (ยังไม่เริ่ม)

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

## P2 — IDOR หน้าอ่าน/แก้ invoices & expenses ตาม id

**สถานะ:** เปิดอยู่ (quotations ปิดไปแล้วใน WS-3 #4, invoices/expenses ยังเหลือ)

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

## P3 — หน้า vouchers list เชื่อม API ที่ไม่มีอยู่ (dead-end)

**สถานะ:** เปิดอยู่ (ไม่ใช่ security leak — fetch 404 ทำให้หน้าแสดงรายการไม่ได้)

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