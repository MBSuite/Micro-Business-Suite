# Capability Audit — Micro-Business-Suite (MBS)

> Historical snapshot from 2026-11-05. Its original `prod Neon` label is superseded
> by the owner's confirmation that Neon is Dev and Supabase is Production. This
> document does not establish the current Production database.
> หลัก: ห้ามเดา — ทุกข้ออ้างอิงไฟล์/ตาราง/คอลัมน์จริง

## 1. สรุปภาพรวมระบบปัจจุบัน

MBS เป็นระบบบัญชี/ภาษีสำหรับ SME บน Next.js 16 + PostgreSQL แบบ multi-tenant (company_id)
พร้อมระบบ license (perpetual/subscription) และ module toggle ต่อ company ผ่าน `company_module_settings`.

โมดูลที่มีอยู่แล้ว (MODULE_REGISTRY): quotations, invoices, recurring, receipts, expenses, payroll,
vouchers, journals, bank_reconcile, mrp, inventory, services, coa, contacts, custom_forms,
tax_reports, reports (P&L), cash_flow, member_management, groups, modules_control, backup,
customer_console, company_profile.

## 2. ตารางคุณสมบัติเทียบ 11 ข้อที่ขอ

| # | คุณสมบัติที่ขอ | สถานะปัจจุบัน | หลักฐาน (ไฟล์/ตาราง) | Gap |
|---|---|---|---|---|
| 1 | Sales & Checkout: สแกนบาร์โค้ด, คิดเงินรวดเร็ว, ส่วนลด/โปรโมชัน, ชำระหลายรูปแบบ (เงินสด/QR/บัตร) | **บางส่วน** — มีใบแจ้งหนี้/ใบเสร็จ, discount_percent ต่อ item, payment_method ใน payments; ไม่มี POS checkout, ไม่มี UI สแกน, ไม่มี promotions engine | `app/invoices/new/page.tsx`, `payments.payment_method`, `invoice_items.discount_percent` | POS checkout, barcode input, promotions, multi-payment UI |
| 2 | Inventory: ตัดสต็อก real-time, แจ้งเตือนใกล้หมด, ติดตามแยก ประเภท/สี/ไซส์ | **บางส่วน** — stock_quantity, low-stock badge ใน UI; ไม่มี auto-deduct on sale; ไม่มี variant (color/size) columns | `products (stock_quantity, type, category_name)`, `app/inventory/page.tsx` | auto-deduct, variant dimensions, alert job |
| 3 | Sales Analytics: สรุปรายวัน/รายเดือน, สินค้าขายดี, ช่วงเวลาขายดี | **ไม่มี** — มี P&L/tax/cashflow แต่ไม่มี sales analytics ตามเวลา/สินค้า | `lib/reports.ts` (P&L only) | new module sales_analytics |
| 4 | CRM: ประวัติการซื้อ, สะสมคะแนน, สิทธิ์สมาชิก | **ไม่มี** — contacts มี customer/supplier; ไม่มี points/tier/purchase history view | `contacts (type, contact_type)`, `lib/contacts.ts` | loyalty points, member tier, purchase history |
| 5 | Employee: สิทธิ์ตามตำแหน่ง, ประวัติ/ยอดขายรายคน | **บางส่วน** — users role/group/permissions, activity_log; ไม่มี per-employee sales report | `users (role, group_id)`, `activity_log`, `lib/permissions.ts` | per-employee sales tracking |
| 6 | Retail: สแกนบาร์โค้ดเร็ว, สต็อกละเอียด, ตัดสต็อกหลายสาขา | **ไม่มีหลายสาขา** — ไม่มี branches table; barcode สร้างได้ (react-barcode) | `products.sku/sku_number`, `react-barcode` dep | branches table, multi-branch stock, POS |
| 7 | F&B: ผังโต๊ะ, เปิด/รวมบิล, KOT, แยกส่วนประกอบเมนู | **ไม่มี** — ไม่มี table/order/kot/bom tables | grep: ไม่พบ table_layout/kot/order | full F&B module |
| 8 | Cloud-based: ทำงานผ่านเน็ต, ดูยอด/สต็อก real-time | **มี** — Neon DB + Vercel + Google integrations | `lib/db.ts`, `docker-compose`, Google APIs | — |
| 9 | On-Premise: ติดตั้งในเครื่อง, ทำงาน offline | **มี** — Docker compose + perpetual mode + offline license | `Dockerfile`, `docker-compose.yml`, `lib/product-mode.ts`, `lib/license.ts` | offline sync (optional) |
| 10 | เชื่อมต่อระบบบัญชี/E-commerce (Shopee, Lazada, เว็บ)/Delivery | **ไม่มี** — ไม่พบ shopee/lazada/delivery/webhook ใน repo | grep ทั้ง repo | connector modules |
| 11 | รูปแบบชำระ: ซื้อขาด vs รายเดือน/รายปี, ค่าธรรมเนียมแอบแฝง | **มีบางส่วน** — PRODUCT_MODE perpetual/subscription, license tier, max_users/transactions; ไม่มีค่าธรรมเนียม EDC/อัปเดต (ไม่มีค่าใช้จ่ายแอบแฝงในระบบ; เป็น native) | `lib/product-mode.ts`, `lib/license-packages.ts` | ชี้แจง pricing ต่อลูกค้า |

## 3. ตารางฐานข้อมูล (Verified)

products: id, sku, name, description, price, stock_qty, unit, category_id, type, sku_number,
source_info, storage_location, product_notes, stock_quantity, category_name, cost_price, company_id
→ ไม่มี color/size/variant/branch columns

contacts: id, name, type, tax_id, address, phone, email, contact_person, is_active, contact_type, company_id
→ ไม่มี loyalty_points, member_tier, member_since

payments: id, invoice_id, amount, payment_date, payment_method, reference_number, notes, company_id,
updated_at, payment_no, status, wht_amount, vat_amount, created_at
→ payment_method เป็น free text; ไม่มี EDC fee column

ไม่มีตาราง: branches, product_variants, loyalty_points, customer_purchases, tables (F&B), orders, kots,
menu_items, menu_components, promotions, ecommerce_connections, delivery_orders

## 4. สถาปัตยกรรมโมดูลที่มีอยู่

- `lib/module-registry.ts`: MODULE_REGISTRY (id/label/icon/category/route/requiresAdmin/superadminOnly/enabledByDefault)
- `lib/module-config.ts`: per-company overrides ใน `company_module_settings` (company_id, module_id, is_enabled)
- `app/api/modules` + `app/api/admin/modules`: toggle ต่อ company
- `lib/license-packages.ts`: tier -> defaultFeatures (basic_access, journal_engine, ...)

→ รองรับ "install module per company" อยู่แล้ว ผ่าน enabledByDefault + overrides. ต้องเพิ่ม module ids ใหม่และ "packs" สำหรับ install แบบกลุ่ม.

## 5. แผนโมดูลแบบ installable packs (ใหม่)

Pack = กลุ่ม modules ที่ติดตั้งพร้อมกัน สำหรับกลุ่มลูกค้าต่างกัน (Retail / F&B / Pharmacy / ...).

ดู `lib/plugin-packs.ts` สำหรับ manifest.

## 6. Gap ที่ต้อง implement (เรียงลำดับ)

1. POS checkout (barcode input + cart + multi-payment + receipt) — module pos_checkout
2. Sales analytics (daily/monthly/top products/peak hours) — module sales_analytics  (implemented รอบนี้)
3. Variant inventory (color/size/type) + auto-deduct + low-stock alert job — module inventory_variants
4. CRM loyalty (points, tier, purchase history, member benefits) — module crm_loyalty
5. Multi-branch stock — module multi_branch
6. Employee sales tracking — module employee_sales
7. F&B (table layout, KOT, bills, menu/BOM) — module f_and_b
8. E-commerce connectors (Shopee/Lazada/web) — module ecommerce_integration
9. Delivery connectors — module delivery_integration
10. Offline sync (optional) — module offline_mode

## 7. สิ่งที่รองรับแล้ว (ไม่ต้องทำ)

- Cloud-based (#8): Neon + Vercel + Google APIs
- On-Premise (#9): Docker + perpetual mode + offline license
- ระบบบัญชี (#10 บางส่วน): accounting internal ครบ (invoices/payments/journals/tax)
- รูปแบบชำระ (#11): perpetual vs subscription ผ่าน PRODUCT_MODE + license tier
- RBAC (#5 บางส่วน): group-based permissions

## 9. สถาปัตยกรรม Core vs Plugin (รอบนี้)

- **MBSuite = Core**: โมดูลหลัก (บัญชี/ภาษี/ผู้ติดต่อ/COA/สมาชิก/กลุ่ม/โมดูลควบคุม) มี `core: true` ใน MODULE_REGISTRY → ปิดไม่ได้จาก /admin/modules
- **Plugin modules**: โมดูลใหม่ (POS, promotions, analytics, CRM, F&B, e-commerce, delivery, multi-branch, variants, employee-sales, offline) มี `core: false` → ติดตั้ง/เปิด-ปิดต่อ company ได้
- **Plugin packs**: `lib/plugin-packs.ts` กลุ่ม module เป็น pack สำหรับกลุ่มลูกค้า (Retail POS, F&B, Pharmacy, ...)

## 10. DB Migrations ที่เพิ่ม (รอบนี้)

- `migrations/add_branches_table.sql` — สาขา (multi-branch)
- `migrations/add_product_variants_table.sql` — variants สี/ไซส์/ประเภท (FK → products, branches)
- `migrations/add_loyalty_tables.sql` — loyalty_accounts + loyalty_transactions (CRM สะสมคะแนน)
- `migrations/add_promotions_table.sql` — โปรโมชัน/คูปอง

ทุกตาราง tenant-scoped (company_id) + guarded FK + indexes; validated syntax บน prod (rollback, ไม่เปลี่ยนข้อมูล)  
วิธี apply: `psql "$DATABASE_URL" -f migrations/add_branches_table.sql` (และไฟล์อื่น) หรือ Neon SQL Editor

## 11. สถานะการติดตั้ง module ปัจจุบัน (plugin)

| Module | core | enabledByDefault | สถานะ |
|---|---|---|---|
| sales_analytics | false | true | implemented |
| pos_checkout | false | false | implemented (scaffold+API) |
| promotions | false | false | scaffold |
| crm_loyalty | false | false | scaffold |
| employee_sales | false | false | scaffold |
| f_and_b | false | false | scaffold |
| ecommerce_integration | false | false | scaffold |
| delivery_integration | false | false | scaffold |
| multi_branch | false | false | scaffold (+ migration) |
| inventory_variants | false | false | scaffold (+ migration) |
| offline_mode | false | false | scaffold |


- ไม่มีค่าธรรมเนียมแอบแฝงในระบบ (ค่า EDC/อัปเดตซอฟต์แวร์ไม่ใช่ส่วนหนึ่งของ MBS; EDC เป็นของธนาคาร/ผู้ให้บริการชำระเงิน)
- การอัปเดตซอฟต์แวร์สำหรับ on-prem ทำผ่าน Docker image ใหม่ (manual); cloud ได้อัตโนมัติ

## 12. รอบนี้ — Implemented (กลุ่มใหญ่)

### Promotions
- `lib/promotions.ts` (rules engine: percentage/fixed/bogo/bundle, min_purchase, max_discount, applies_to, date range, usage limit)
- API: /api/promotions (CRUD), /api/promotions/[id]
- Page: /promotions
- Apply at POS checkout (auto best promotion + manual discount) + usage increment

### CRM Loyalty
- `lib/loyalty.ts` (getOrCreateAccount, accruePoints 1 pt/100฿, computeTier bronze/silver/gold/platinum, redeemPoints)
- API: /api/crm/members, /api/crm/members/[contactId]
- Page: /crm (member list + detail + points history + purchase history)
- Auto-accrual on POS checkout when contact selected

### Multi-Branch
- Migration: branches + branch_stock
- API: /api/branches (GET/POST)
- Page: /branches (create + list)
- POS: branch selector + deduct branch_stock

### F&B
- Migration: fb_tables, fb_orders, fb_order_items, fb_kots
- API: /api/fb/tables, /api/fb/orders, /api/fb/orders/[id] (add/remove item, KOT, bill, pay, cancel)
- Page: /fb (table layout grid + order panel + KOT + bill + pay)

### E-commerce / Delivery connectors
- Migration: integration_connections
- API: /api/integrations/connections (GET/POST/DELETE), /api/integrations/webhook (inbound order import)
- Pages: /integrations/ecommerce, /integrations/delivery (connection management UI)

### Migrations ทั้งหมดรอบนี้
branches, product_variants, loyalty (accounts+transactions), promotions, branch_stock, fb_tables/orders/items/kots, integration_connections

### สถานะ module (อัปเดต)
| Module | core | enabledByDefault | สถานะ |
|---|---|---|---|
| sales_analytics | false | true | implemented |
| pos_checkout | false | false | implemented |
| promotions | false | false | implemented |
| crm_loyalty | false | false | implemented |
| multi_branch | false | false | implemented |
| inventory_variants | false | false | scaffold (+ migration) |
| employee_sales | false | false | scaffold |
| f_and_b | false | false | implemented |
| ecommerce_integration | false | false | implemented |
| delivery_integration | false | false | implemented |
| offline_mode | false | false | scaffold |
