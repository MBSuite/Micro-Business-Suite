# DB Schema — Micro-Business-Suite

> สถานะอัปเดต: 2026-09-24 (หลัง P1/P2 subscription + integration harness)
> ระดับความเชื่อมั่น: **CONFIRMED** = เห็นจาก `tests/integration/schema.sql` + route queries + migrations
> รัน local = ต่อ **prod DB** (Neon) ผ่าน `.env.local` (POSTGRES_URL/DATABASE_URL)
> ค่าจริงของ prod schema อาจมีคอลัมน์เพิ่ม (db_schema ส่วนตัว เช่น `rd_submission_id`, `customer_id`, `user_id` บนบางตาราง) — จัดการผ่าน `/api/db_schema`

## ตาราง CONFIRMED

### `companies` — บริษัท/ลูกค้า (tenant)
| column | type | note |
|---|---|---|
| id | SERIAL PK | |
| name | varchar | |
| plan_type | varchar | default 'TRIAL' |
| max_users | int | default 1 |
| subscription_status | varchar | default 'Active' |
| expiry_date | timestamptz | หมดอายุ subscription |
| trial_end | timestamptz | จบ trial |
| license_key | text | key ของบริษัท |
| customer_name | varchar | จาก P1 |
| created_at / updated_at | timestamptz | |

### `users`
id SERIAL PK · name · **email UNIQUE (ยังไม่มี constraint จริง — RED WS-3)** · password (bcrypt hash) ·
role (superadmin/admin/user) · status (Active) · company_id FK · created_at

### `company_settings`
id PK · name (ชื่อบริษัท default) · invoice_prefix (default 'INV')

### `contacts`
id PK · name · email · phone · **address** · **tax_id** · company_id FK

### `invoices`
id PK · invoice_number UNIQUE · issue_date · due_date · contact_id · net_amount DEC ·
vat_amount · **total_amount** · status (default 'sent') · quotation_id · **company_id** FK (ตั้งตอนสร้างแล้ว) · created_at/updated_at

### `invoice_items`
id PK · invoice_id FK · product_id · description · quantity · unit_price · total_price

### `payments`
id PK · payment_no UNIQUE · invoice_id FK · amount · payment_date · payment_method ·
status (default 'completed') · notes · contact_id · wht_amount · vat_amount · **company_id** FK (ตั้งตอนสร้างแล้ว) · created_at/updated_at

### `journal_entries`
อ้างจากคำสั่งลบ payment: คอลัมน์ `reference_no` + `description` (pattern `%RC-<paymentId>%`, `%รับชำระ%`)

### `groups` / group permissions (system)
`lib/permissions.ts`: **group id 1 = superadmin (canonical)**, **id 2 = admin**;
`isInGroup(userId, groupId)`, `isSuperAdmin(userId)` = isInGroup(userId, 1)

## ตารางที่รู้ชื่อ แต่ยังไม่ confirm column (ห้ามเดา — อ่าน migration/route ก่อนใช้)
`quotations` · `expenses` · `products` · `services` · `vouchers`
- ทั้งหมดนี้**ยังไม่มี `company_id` (RED WS-3 #4)** ยกเว้นหลัง migration เฟสถัดไป

## Migration ที่ทำแล้ว
- `migrations/add_customer_subscription.sql` — เพิ่ม subscription columns บน `companies` (รันบน Neon สำเร็จแล้ว, ไม่ใช่แค่ยังไม่รัน)
- `migrations/add_company_tenant_scope.sql` — backfill company_id ให้ admin/superadmin คนแรก แต่ quota/tenant บางจุดยังค้าง (ดู gating ref)

## หมายเหตุ query utils
- `lib/db.ts` export `query` (Pool max 3, idleTimeout 10s, connectionTimeout 15s, **enforce URL มี**)
- **`sslmode`:** อ่านจาก URL (default `require`) → ต่อ postgres ท้องถิ่นที่ไม่มี SSL ต้องต่อท้าย `?sslmode=disable` ไม่งั้น 500 ทุก query