# Handoff Document — MBSuite Platform Expansion

**วันที่:** 2026-11-07
**สาขา:** main (clean)
**Commit ล่าสุด:** (ดู `git log --oneline -1`)
**ผู้ส่ง:** session นี้
**ผู้รับ:** session ถัดไป (แยก session)

---

## 1. วิสัยทัศน์ (Vision)

MBSuite = **Platform รวม Software บริหารจัดการองค์กรทั้งหมด** (ไม่ใช่แค่ MBS เดียว)

- **MBS Core** = ตัวจัดการบัญชีโดยตรง (Accounting Hub) — บัญชี, ภาษี, ใบ paying, รายงาน, RBAC, multi-tenant
- **Suites** = standalone apps แยกธุรกิจ (F&B, Service, Hotel/Booking, Rental, Retail/POS, Pharmacy, etc.)
- **Bridge Pattern** = Suite standalone เชื่อมกับ MBS Core ผ่าน plugin/module layer ที่มีอยู่ แต่เปลี่ยนเป็น "bridge" แทน "embedded module"
- **MBS Core คงเดิม** — ไม่เปลี่ยนแปลง (ใหญ่แล้ว, รองรับองค์กรระดับกลาง) แค่ปรับปรุง plugin + module ที่เพิ่มเข้ามาในอนาคต

### โมเดลธุรกิจ (Business Model)

| Tier | ลูกค้า | ได้รับ |
|---|---|---|
| **Suite Only** | ทุนน้อย / ทดลองใช้ | ใช้ Suite standalone ได้ luxury experience เฉพาะธุรกิจ |
| **Suite + MBS Core** | ธุรกิจที่ต้องการรายละเอียด | ทุกอย่าง + ภาษี, P&L, รายงาน, บัญชี |
| **MBS Core Only** | ลูกค้าที่มีระบบอยู่แล้ว | บัญชี/ภาษี/รายงาน |

**ข้อดี:** MBS Core ไม่หนักเกินไป, ยืดหยุ่น, ลูกค้าเลือกซื้อเฉพาะที่ใช้, แต่สุดท้ายต้องซื้อ MBS Core เป็นหลัก (เพราะเป็นตัวเดียวที่คำนวณภาษี + วิเคราะห์ P&L ได้)

---

## 2. Suites ที่คิดไว้

| Suite | ลักษณะธุรกิจ | Domain-Specific Features |
|---|---|---|
| **MBS Core** | บัญชี/ภาษี (hub) | สมุดรายวัน, COA, ภาษี, รายงาน, RBAC |
| **F&B Suite** | ร้านอาหาร/คาเฟ่ | โต๊ะ, KOT, เปิด/รวมบิล, เมนู |
| **Service Suite** | ร้านบริการ/ที่ปรึกษา | จองคิว, ใบเสนอราคา, บริการ |
| **Hotel/Booking Suite** | จองห้องพัก | ห้อง, การจอง, check-in/out, แม่บ้าน |
| **Rental Suite** | ธุรกิจเช่า | ทรัพย์สิน, สัญญาเช่า, ค่าเช่า, บำรุงรักษา |
| **Retail Suite** | ร้านค้า/ค้าส่ง | POS, สต็อก, บาร์โค้ด, โปรโมชั่น |
| **Pharmacy Suite** | ร้านขายยา | ใบสั่งยา, สต็อกยา, หมดอายุ |

**ทุก Suite มีร่วมกัน (Shared Core):** การคิดเงิน, บันทึก รายรับ-รายจ่าย, ใบ paying, Tenant (company_id), License และฐานข้อมูล PostgreSQL ชุดเดียว (Neon = Dev, Supabase = Production) — ส่วน Auth เป็นของแต่ละแอป ไม่มี SSO ข้ามแอป

---

## 3. Bridge (สะพาน) — วิธีเชื่อม

| ทิศทาง | ข้อมูล | วิธี |
|---|---|---|
| Suite → MBS Core | รายรับ/รายจ่าย/ใบ paying/รายละเอียด | REST API + Webhook (sync finance events) |
| MBS Core → Suite | ผังบัญชี, ชื่อ/ราคาสินค้า (optional) | REST API (read-only) |
| Shared | Database, Tenant (company_id), License | Shared PostgreSQL; each app has its own session/auth. No cross-site token. |

### Sync Method (อนุมัติแล้ว)
- **REST API + Webhook** (loose coupling; shared database แต่แต่ละแอปไม่แตะตารางของกันโดยตรง)
- Suite ส่ง finance event → MBS Core API → สร้าง journal entry / invoice / expense

### Bridge API — เปรียบเทียบ

| ตัวเลือก | ข้อดี | ข้อเสีย | แนะนำ |
|---|---|---|---|
| **สร้าง endpoint ใหม่ `/api/bridge/sync`** | ออกแบบ schema ได้เอง, versioning ง่าย, แยกจาก legacy webhook, รองรับ batch sync, retry, idempotency | ต้องเขียนเพิ่ม, ต้อง maintain 2 endpoints | ✅ แนะนำ |
| **ใช้ `/api/integrations/webhook` ที่มีอยู่** | ไม่ต้องเขียนใหม่, code มีอยู่แล้ว | schema ถูกออกแบบสำหรับ e-commerce/delivery, ไม่ fit finance events, ไม่มี versioning, ยากต่อการ extend | ❌ ไม่แนะนำ |

**สรุป:** สร้าง `/api/bridge/sync` ใหม่ (loose coupling, versioning, idempotency) — ไม่แตะ `/api/integrations/webhook` เดิม

---

## 4. ข้อกำหนด Suite (Standalone Requirements)

แต่ละ Suite ที่สร้างเพิ่มต้อง:
1. **Standalone** — รัน/deploy แยกได้ (Vercel/Docker)
2. **Auth** — ล็อกอินและออก session ของแอปเอง; ไม่มี SSO หรือ token ข้ามแอป
3. **Tenant isolation** — `company_id` บนทุกตาราง
4. **Sync** — ส่งข้อมูลการเงินไป MBS Core ผ่าน Bridge API
5. **Offline-capable** (optional) — ใช้ offline แล้ว sync ภายหลัง
6. **Module registration** — ลงทะเบียนใน `lib/module-registry.ts` + `lib/plugin-packs.ts`

---

## 5. ข้อกำหนดสำคัญ

- **ไม่เปลี่ยนแปลง MBS Core** (lib/auth.ts, lib/db.ts, proxy.ts, core modules) — ใหญ่แล้ว รองรับองค์กรระดับกลางได้
- **ปรับปรุงเฉพาะ plugin + module layer** ที่เพิ่มเข้ามาในอนาคต
- **Bridge pattern** — Suite standalone เชื่อมกับ MBS Core ผ่าน plugin module ที่มีอยู่ แต่เปลี่ยนเป็น "bridge" แทน "embedded module"
- **MBS Core เป็น must-have** สำหรับรายละเอียด (ภาษี, P&L, รายงาน) — Suite ใช้ standalone ได้แต่ถ้าต้องการรายละเอียดต้องซื้อ MBS Core

---

## 6. ข้อมูลรายละเอียด (Vision ใหม่)

### ลูกค้าหลากหลาย Suite
- ร้านขายอาหาร (F&B) → F&B Suite
- ร้านบริการ (Service) → Service Suite
- ธุรกิจจองห้องพัก (Hotel/Booking) → Hotel/Booking Suite
- ธุรกิจเช่า (Rental) → Rental Suite
- ร้านค้า/ค้าส่ง (Retail) → Retail Suite
- ร้านขายยา (Pharmacy) → Pharmacy Suite

### โมเดลธุรกิจ
- **Suite Only** — ทุนน้อย/ทดลองใช้ ได้ luxury experience เฉพาะธุรกิจ
- **Suite + MBS Core** — ธุรกิจที่ต้องการรายละเอียด (ภาษี, P&L, รายงาน)
- **MBS Core Only** — ลูกค้าที่มีระบบอยู่แล้ว

### ข้อดี
1. MBS Core ไม่หนักเกินไป (ไม่ต้องรวมทุก feature)
2. ยืดหยุ่น (ลูกค้าเลือกซื้อเฉพาะ Suite ที่ใช้)
3. MBS Core เป็น must-have สำหรับรายละเอียด
4. Suite standalone → ลูกค้าทุนน้อย/ทดลองใช้ได้รับประสบการณ์ luxury เฉพาะธุรกิจ

---

## 7. สถานะปัจจุบัน (ณ 2026-11-07)

### MBS Core (Micro-Business-Suite)
- ✅ Build / TSC / Lint ผ่าน
- ผลตรวจเดิม ณ 2026-11-07: Unit 8/8 + Integration 9/9 (ไม่ใช่ผลปัจจุบันหรือ owner acceptance; ดูผลล่าสุดใน [docs/PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md))
- ✅ License valid (perpetual, PROFESSIONAL)
- ✅ DB: 53 tables, migrations applied
- ✅ Security headers, Rate limiting, Health endpoint
- ✅ Google Drive, Gmail, Gemini AI, Recurring billing env ครบ
- ✅ Performance (parallel queries, optimizePackageImports)
- ✅ Audit hardening (backup/reset scope, auth backfill migration, CSP, start script)
- ✅ Production checklist (`docs/PRODUCTION_CHECKLIST.md`)
- ⏳ Bridge/Sync API `/api/bridge/sync` — local code and disposable-DB auth checks pass; production deployment and authenticated production verification are not done.
- ✅ Admin page `/admin/bridge-sync` — sync log viewer
- ✅ Unit tests `tests/bridge-sync-validation.test.mjs` (15 pass)
- ⏳ Bridge API v1.0 (`/api/bridge/sync`) — local implementation/tests cover POST and authenticated GET; production deployment and verification remain pending.
- ✅ Migration `add_bridge_sync_log.sql` (idempotent, tested on test container)
- ✅ Backup script (`scripts/backup-prod.mjs`) + Smoke test script (`scripts/smoke-test-bridge.mjs`)
- ✅ Vercel env checklist (`docs/VERCEL_ENV_CHECKLIST.md`)

### Micro-Menu-Online (Suite)
- ✅ Bridge sync trigger (fire-and-forget) หลังชำระเงิน (single + batch)
- ✅ `lib/bridge-sync.ts` — standalone mode (no-op ถ้าไม่ตั้ง env), retry 2 ครั้ง
- ✅ Multi-tenant `company_id` column (Prisma schema + migration `20261107_add_company_id`)
- ✅ Query scoping by `companyId` (getCompanyId) ในทุก data routes (categories, products, tables, users, orders, payments, reports)
- ✅ Vercel env checklist (`docs/VERCEL_ENV_CHECKLIST.md`)

### Suites (Standalone — สร้างแล้ว 6 ตัว)
- ✅ Micro-Retail (POS, inventory, promotions, bridge sync, company_id)
- ✅ Micro-FNB (tables, KOT, orders, bridge sync, company_id)
- ✅ Micro-Service (bookings, services, bridge sync, company_id)
- ✅ Micro-Hotel (rooms, bookings, housekeeping, bridge sync, company_id)
- ✅ Micro-Rental (assets, contracts, rents, maintenance, bridge sync, company_id)
- ✅ Micro-Pharmacy (prescriptions, stock batches, expiry, bridge sync, company_id)
- ✅ ทุก Suite: Prisma schema + migration + API routes + bridge sync + build ผ่าน
- ✅ ทุก Suite: git repo เริ่มต้น + commit แล้ว

### MBSuite.Dev (Landing + Docs)
- ✅ React + Vite, i18n (th/en)
- ✅ Documents: guide, brochure, articles
- ✅ Marketplace page (เพิ่มแล้ว)
- ✅ Plugins/Modules section (เพิ่มแล้ว)
- ✅ Trial 14→30 วัน

### Plugin System (MBS Core)
- `lib/module-registry.ts` — module ids (core + plugin)
- `lib/plugin-packs.ts` — packs (retail_pos, f_and_b, pharmacy, service_business, etc.)
- `/admin/modules`, `/admin/plugins` — toggle ต่อ company
- DB: `company_module_settings` (tenant-scoped)

### ไฟล์สำคัญ
- `lib/auth.ts` — JWT auth, ensureCompanyLicensingSchema
- `lib/db.ts` — PostgreSQL pool (SSL strict)
- `proxy.ts` — auth + RBAC + rate limiting
- `next.config.ts` — security headers + optimizePackageImports
- `app/api/health/route.ts` — health endpoint
- `scripts/bootstrap-init-db.mjs` — DB bootstrap runner
- `migrations/` — idempotent SQL migrations
- `docs/PRODUCTION_CHECKLIST.md` — production checklist
- `docs/PRESENTATION.md` — presentation document
- `docs/HANDOFF.md` — handoff document (นี้)

---

## 8. Roadmap (อัปเดต)

| Phase | Scope | Status |
|---|---|---|
| Phase 1 | MBS Core (บัญชี, ภาษี, ใบ paying) | ✅ เสร็จ |
| Phase 2 | Plugin modules (POS, F&B, CRM, multi-branch, inventory) | ✅ Scaffold + บางส่วน implement |
| Phase 3 | Bridge/Sync layer (REST API + Webhook) ระหว่าง Suites ↔ MBS Core | ✅ Code เสร็จ (pending deploy + smoke test) |
| Phase 4 | Standalone Suite deployment (แต่ละ app แยก deploy) | 🔲 ยังไม่ทำ |
| Phase 5 | Marketplace (หน้ารวม module/app ให้ลูกค้าเลือก) | 🔲 เริ่มใน MBSuite.Dev |
| Phase 6 | New Suites (Retail, F&B, Service, Hotel, Rental, Pharmacy) | ✅ Scaffold + domain models + API routes + bridge sync + build pass |

### Priority Suite (ตามที่อนุมัติ)
- **Micro-Menu-Online** (ปรับปรุง) → ทดสอบก่อน (อยู่ที่ `/home/neon13/workspace/services/next/01-PRODUCTS-BUSINESS/...` หรือ path อื่น)
- แล้วค่อย F&B, Service, Hotel, Rental, Pharmacy

---

## 9. คำถามที่ต้องยืนยัน (สำหรับ session ถัดไป)

1. **Sync method:** REST API + Webhook (อนุมัติแล้ว) — ใช้ `/api/bridge/sync` ใหม่ หรือ `/api/integrations/webhook` ที่มีอยู่?
2. **Auth:** แต่ละแอปล็อกอินเอง (ไม่มี SSO) — ยืนยันแล้ว
3. **Tenant / Database:** เจ้าของยืนยันให้ Core และทั้ง 6 modules ใช้ฐานข้อมูล PostgreSQL ชุดเดียวกัน (Neon = Dev, Supabase = Production); ทุกแอปเข้าถึงเฉพาะตาราง prefix ของตัวเองและเชื่อมกันผ่าน API/Bridge — ก่อนเปลี่ยน schema/migration ให้ปฏิบัติตาม §13
4. **Marketplace:** สร้างใน MBSuite.Dev (landing) — อนุมัติแล้ว
5. **Priority Suite:** Micro-Menu-Online ก่อน — อนุมัติแล้ว

---

## 10. ข้อกำหนด (Constraints)

- **ไม่เปลี่ยนแปลง MBS Core** (lib/auth.ts, lib/db.ts, proxy.ts, core modules)
- **ปรับปรุงเฉพาะ plugin + module layer** ที่เพิ่มเข้ามาในอนาคต
- **Bridge pattern** — Suite standalone เชื่อมกับ MBS Core ผ่าน plugin module
- **MBS Core เป็น must-have** สำหรับรายละเอียด (ภาษี, P&L, รายงาน)
- **Suite standalone** — ลูกค้าทุนน้อย/ทดลองใช้ได้รับประสบการณ์ luxury เฉพาะธุรกิจ

---

## 11. ไฟล์ที่เกี่ยวข้อง

### MBS (Micro-Business-Suite)
- `lib/module-registry.ts` — module ids (core + plugin)
- `lib/plugin-packs.ts` — packs (retail_pos, f_and_b, pharmacy, service_business, etc.)
- `app/admin/modules/page.tsx` — เปิด/ปิด module ต่อ company
- `app/admin/plugins/page.tsx` — จัดการ plug-in/add-on
- `app/api/integrations/webhook/route.ts` — inbound webhook (import ออเดอร์ → invoice)
- `app/api/bridge/sync/route.ts` — Bridge API (Suite → MBS Core finance sync)
- `app/api/admin/bridge-sync/route.ts` — admin API สำหรับ bridge sync log
- `app/admin/bridge-sync/page.tsx` — admin page แสดง bridge sync log
- `lib/bridge-sync-validation.mjs` — validation helpers (testable)
- `tests/bridge-sync-validation.test.mjs` — unit tests (15 pass)
- `migrations/add_bridge_sync_log.sql` — idempotency store migration
- `scripts/backup-prod.mjs`, `scripts/smoke-test-bridge.mjs` — production helpers
- `docs/VERCEL_ENV_CHECKLIST.md` — Vercel env checklist
- `docs/PRODUCTION_CHECKLIST.md` — production checklist
- `docs/PRESENTATION.md` — presentation document
- `docs/HANDOFF.md` — handoff document (นี้)
- `AGENTS.md` — rules + deployed URLs

### MBSuite.Dev (landing + docs)
- `src/App.tsx` — routing
- `src/components/Marketplace.tsx` — marketplace page (เพิ่มแล้ว)
- `src/components/PluginsModules.tsx` — plugin/module section (เพิ่มแล้ว)
- `src/i18n/th.json`, `src/i18n/en.json` — i18n (th/en)
- `dist/` — production build

---

## 12. ข้อควรระวัง (Safety Rules)

- **อย่าแก้ไข MBS Core** (lib/auth.ts, lib/db.ts, proxy.ts, core modules) — ใหญ่แล้ว รองรับองค์กรระดับกลางได้
- **อย่าแตะ production DB** โดยไม่ตรวจ branch ก่อน (AGENTS.md rule)
- **อย่ารัน migration/seeds** โดยไม่ backup + owner approval
- **อย่า push** โดยไม่ได้รับคำสั่ง (workspace rule)
- **อย่า copy/move/nest MBSuite.Dev** เป็นส่วนของ Micro-Business-Suite repo

## 13. Shared Database — OpenCode Must Follow Before Any DB Work

### Owner decision and current boundary
- The target architecture is **one PostgreSQL database shared by MBS Core and all six standalone modules**. This is not authorization to point module `DATABASE_URL`s at Core or to change any environment variable yet.
- Existing Core and module schemas contain generic model/table names. The exact module naming contract and env contract are specified below for OpenCode to implement and test in isolation; production DDL, data movement, Vercel env changes, and deployment remain unapproved.
- The Core database currently contains owner-designated sample-company records for planning/testing: ID `1` `Your Company`, ID `2` `innovation`, ID `3` `บริษัท ทดสอบ จำกัด`. These are test references only, not confirmed production mappings for any module.

### Local schema collision evidence (read-only inventory, 2026-11-08)
- All six module Prisma schemas currently map shared models to the same physical table names: `users`, `categories`, `products`, `tables`, `orders`, `order_items`, `payments`, `store_settings`. All six also declare the same PostgreSQL enum names: `Role`, `OrderStatus`, `OrderSource`, `ItemStatus`, `PaymentMethod`.
- Current domain tables: Service `bookings`; Retail `promotions`; Rental `assets`, `contracts`, `rents`, `maintenance`; Pharmacy `prescriptions`, `prescription_items`, `stock_batches`; Hotel `rooms`, `bookings`, `housekeeping`; F&B has no additional domain table in its current Prisma schema.
- A prior read-only inventory of Core found existing `public` tables named `assets`, `bookings`, `categories`, `payments`, `products`, `promotions`, and `users`; Core also owns `tables`, `orders`, `order_items`, and other accounting tables. Recheck the complete live catalog before any DDL.

### Naming contract for OpenCode implementation
- Keep Core's existing table names and Core Prisma schema unchanged. Do not have modules share Core's table rows; integration remains through the authenticated Bridge API.
- Keep module tables in PostgreSQL `public` and assign each module a unique physical prefix. This avoids dependence on `search_path` and Prisma multi-schema behavior:

  | Module | Prefix | Current shared tables | Current domain tables |
  |---|---|---|---|
  | Service | `mbs_service_` | `users`, `categories`, `products`, `tables`, `orders`, `order_items`, `payments`, `store_settings` | `bookings` |
  | Retail | `mbs_retail_` | `users`, `categories`, `products`, `tables`, `orders`, `order_items`, `payments`, `store_settings` | `promotions` |
  | Rental | `mbs_rental_` | `users`, `categories`, `products`, `tables`, `orders`, `order_items`, `payments`, `store_settings` | `assets`, `contracts`, `rents`, `maintenance` |
  | Pharmacy | `mbs_pharmacy_` | `users`, `categories`, `products`, `tables`, `orders`, `order_items`, `payments`, `store_settings` | `prescriptions`, `prescription_items`, `stock_batches` |
  | Hotel | `mbs_hotel_` | `users`, `categories`, `products`, `tables`, `orders`, `order_items`, `payments`, `store_settings` | `rooms`, `bookings`, `housekeeping` |
  | F&B | `mbs_fnb_` | `users`, `categories`, `products`, `tables`, `orders`, `order_items`, `payments`, `store_settings` | none currently |

- Apply the prefix to every physical table and enum name, not Prisma model/field names. Examples: Service `User @@map("mbs_service_users")`, Service `Booking @@map("mbs_service_bookings")`, F&B `OrderItem @@map("mbs_fnb_order_items")`; enum physical names follow the same rule, e.g. `@@map("mbs_service_role")`. Preserve existing snake_case column names and all application-level model/field names.
- Prefix every explicitly mapped PostgreSQL index, unique constraint, and relation constraint with the same module prefix as well. Check all generated identifiers are unique and within PostgreSQL's 63-byte identifier limit. Do not create any cross-module foreign keys.
- Use a distinct least-privilege database role/credential per module, granting access only to that module's prefixed objects (and only required operations). Do not grant a module role access to Core or another module's objects. Include grants for newly migrated objects in the migration plan.
- If an existing module database contains data, do not rename, drop, or overwrite its tables blindly. First inventory that source and provide a non-destructive data-preserving migration/import plan for owner approval.

### Mandatory local Docker validation before any Vercel work
- The Core `docker-compose.yml` runs only the app and connects it to Neon; it does not provide a database service. `tests/integration/run.mjs` creates/uses `mbs-integration-pg` and drops/recreates Core integration tables in database `mbs_test`. Do not point that runner at Neon or a database with retained data, and do not use its `mbs_test` database for module migration tests.
- OpenCode must create/use a separate, disposable Docker PostgreSQL test container and database for the shared-module rehearsal (suggested names: container `mbs-shared-modules-test-pg`, database `mbs_shared_modules_test`; do not add a Postgres service to the app's production Docker Compose). Keep its port/credentials isolated from all retained databases and local `.env.local` files.
- Apply all six module migrations to that same empty test database. Verify there are no duplicate objects; every table, enum, index, unique constraint, and relation constraint has the assigned module prefix; existing Core-style unprefixed objects are untouched; and each module role can access only its own prefixed objects. Exercise representative module CRUD and the existing Bridge contract using disposable fixtures only. Re-run the harness from a clean database to prove migrations are repeatable.
- Local Docker test URLs are disposable direct PostgreSQL URLs; they are test-only and are not the Production `DATABASE_URL` contract. Do not copy Docker credentials into Vercel or `.env.local`.
- Keep this Docker database after tests only if it is clearly named and documented as disposable test infrastructure; otherwise remove only the explicitly named test container/database after confirming it contains no retained data. Never remove the existing `mbs-integration-pg` container as part of this task.

### Environment-variable contract for OpenCode implementation
- Each module's Production Vercel project uses only these runtime variables:

  | Variable | Contract |
  |---|---|
  | `DATABASE_URL` | Neon pooled runtime URL for the shared database, using that module's dedicated restricted role. Never point all modules at one unrestricted credential. |
  | `SESSION_SECRET` | Unique cryptographically random value per module; at least 32 characters. Never reuse between modules. |
  | `NEXT_PUBLIC_APP_URL` | Exact public HTTPS origin for that module: Service `https://micro-business-service.vercel.app`, Retail `https://micro-business-retail.vercel.app`, Rental `https://micro-business-rental.vercel.app`, Pharmacy `https://micro-business-pharmacy.vercel.app`, Hotel `https://micro-business-hotel.vercel.app`, F&B `https://micro-business-fnb.vercel.app`. |
  | `MBS_HUB_URL` | Core origin `https://micro-business-suite.vercel.app`. Bridge remains optional for standalone operation. |
  | `MBS_BRIDGE_TOKEN` | Bridge credential shared with Core's receiver; rotate only under a coordinated cutover plan. Do not print or commit it. |
  | `MBS_COMPANY_ID` | Required positive integer tenant ID (stored as a string by module models) for company scoping; use the same explicit Core company mapping when Bridge is enabled. Production mapping is not known or approved yet, so do not configure a guessed/default value. |

- Remove `MENU_COMPANY_ID` as a competing company selector; `MBS_COMPANY_ID` is the sole canonical name. Remove the implicit company ID `1` fallback from company scoping and Bridge payloads. Validate the tenant ID explicitly in both standalone and integrated operation; standalone mode may omit Bridge configuration, but a partially configured Bridge must report a clear configuration error rather than silently using company 1.
- Module service-token Bridge requests must always send the validated `MBS_COMPANY_ID`. Core's current Bridge validator permits a missing `company_id` for authenticated user-session requests and the route requires it for service-token requests; preserve that distinction when updating Bridge validation/tests.
- Keep Production `DATABASE_URL` pooled for runtime. Configure Prisma CLI migrations to require a separate `DIRECT_URL` pointing to a direct, non-pooled database. Use the disposable Docker database for the first full migration/isolation rehearsal; use a disposable Neon branch for a later production-like rehearsal only after the Docker checks pass. Never fall back from a missing migration URL to a production runtime `DATABASE_URL`. Do not put a migration credential in Vercel Production; prove `prisma generate` and the Vercel build can run without a production direct credential.
- Do not change Core's existing `POSTGRES_URL`/`DATABASE_URL` configuration as part of this module task. Core's Bridge token change is a separately coordinated operation.

### Required sequence
1. In all six module repositories, implement the naming and environment contracts above: update Prisma physical mappings, every query/raw SQL reference, Prisma config, company scoping, Bridge validation, env examples, and directly related docs/tests. Do not edit Core's tables or existing production environment in this step.
2. Inventory each module's current data source and existing migrations before generating a migration. Present the proposed non-destructive migration/data-preservation plan and per-module role grants for owner review; do not assume there are no existing module records.
3. Perform the complete shared-schema rehearsal against the separate disposable Docker PostgreSQL database described above. Prove modules cannot read/write another module's prefixed tables or Core tables; run typecheck, lint, build, and focused tests for all six.
4. After the Docker rehearsal passes, test migration compatibility on a disposable Neon branch using a direct (non-pooled) URL. Report the exact branch/database target and results without exposing connection strings.
5. Do not run `prisma db push`, migrations, seeds, or write tests against the retained Core database. Do not change Production `DATABASE_URL`s, deploy, or migrate Production until the owner separately approves after reviewing the plan and backup.
6. Use the sample company identities only in isolated test databases/fixtures. Never treat their IDs as module-to-company production mappings; do not set `MBS_COMPANY_ID` until the owner provides the explicit Production mapping.
7. Only after code changes and both isolated rehearsals are complete, provide the exact per-project Production env checklist and identify unresolved values. Do not request Vercel access before these acceptance criteria pass; Vercel access/configuration is a later separately authorized step.

### OpenCode acceptance criteria
- Report the exact final table/type/index names and migration files for each module, plus tests proving namespace and role isolation.
- Include the disposable Docker database setup/teardown procedure and the recorded results of both the Docker rehearsal and disposable Neon-branch rehearsal.
- Report which env keys each module requires, which are optional in standalone mode, and any unresolved Production value. Never include secret values in the report.
- No migration against the retained Core database, Production environment change, or deployment is approved by this handoff alone.
- Do not ask the owner to repeat the selected shared-database direction or the three designated sample-company identities; ask only for decisions that remain genuinely unspecified.

---

*เอกสารนี้เริ่มสร้างเมื่อ 2026-11-07 และอัปเดตข้อกำหนด Shared Database เมื่อ 2026-11-08*
*อ้างอิง: README.md, AGENTS.md, docs/PRODUCTION_CHECKLIST.md, docs/PRESENTATION.md, docs/ARCHITECTURE.md, docs/BUSINESS_RULES.md, docs/RBAC_STANDARD.md, docs/CORE_RULES.md, docs/AUTH_RULES.md*
