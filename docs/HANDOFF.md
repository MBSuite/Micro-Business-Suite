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

**ทุก Suite มีร่วมกัน (Shared Core):** การคิดเงิน, บันทึก รายรับ-รายจ่าย, ใบ paying, Auth (JWT SSO), Tenant (company_id), License

---

## 3. Bridge (สะพาน) — วิธีเชื่อม

| ทิศทาง | ข้อมูล | วิธี |
|---|---|---|
| Suite → MBS Core | รายรับ/รายจ่าย/ใบ paying/รายละเอียด | REST API + Webhook (sync finance events) |
| MBS Core → Suite | ผังบัญชี, ชื่อ/ราคาสินค้า (optional) | REST API (read-only) |
| Shared | Auth (JWT SSO), Tenant (company_id), License | Shared token + tenant isolation |

### Sync Method (อนุมัติแล้ว)
- **REST API + Webhook** (loose coupling, ไม่ shared DB โดยตรง)
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
2. **Auth** — ใช้ JWT เดียวกัน (SSO) ผ่าน MBS Core
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
- ✅ Unit 8/8 + Integration 9/9 pass
- ✅ License valid (perpetual, PROFESSIONAL)
- ✅ DB: 53 tables, migrations applied
- ✅ Security headers, Rate limiting, Health endpoint
- ✅ Google Drive, Gmail, Gemini AI, Recurring billing env ครบ
- ✅ Performance (parallel queries, optimizePackageImports)
- ✅ Audit hardening (backup/reset scope, auth backfill migration, CSP, start script)
- ✅ Production checklist (`docs/PRODUCTION_CHECKLIST.md`)

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
| Phase 3 | Bridge/Sync layer (REST API + Webhook) ระหว่าง Suites ↔ MBS Core | 🔲 ยังไม่ทำ |
| Phase 4 | Standalone Suite deployment (แต่ละ app แยก deploy) | 🔲 ยังไม่ทำ |
| Phase 5 | Marketplace (หน้ารวม module/app ให้ลูกค้าเลือก) | 🔲 เริ่มใน MBSuite.Dev |
| Phase 6 | New Suites (Hotel, Rental, Pharmacy, Service) | 🔲 ยังไม่ทำ |

### Priority Suite (ตามที่อนุมัติ)
- **Micro-Menu-Online** (ปรับปรุง) → ทดสอบก่อน (อยู่ที่ `/home/neon13/workspace/services/next/01-PRODUCTS-BUSINESS/...` หรือ path อื่น)
- แล้วค่อย F&B, Service, Hotel, Rental, Pharmacy

---

## 9. คำถามที่ต้องยืนยัน (สำหรับ session ถัดไป)

1. **Sync method:** REST API + Webhook (อนุมัติแล้ว) — ใช้ `/api/bridge/sync` ใหม่ หรือ `/api/integrations/webhook` ที่มีอยู่?
2. **Auth:** JWT เดียวกัน (SSO) หรือแยก auth ต่อ Suite?
3. **Tenant:** แต่ละ Suite มี `company_id` เดียวกัน (multi-tenant) หรือแยก database ต่อ company?
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
- `app/api/bridge/sync` — (ยังไม่มี) Bridge API สำหรับ sync finance events
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

---

*เอกสารนี้สร้างเมื่อ 2026-11-07 สำหรับ handoff ไปยัง session ถัดไป*
*อ้างอิง: README.md, AGENTS.md, docs/PRODUCTION_CHECKLIST.md, docs/PRESENTATION.md, docs/ARCHITECTURE.md, docs/BUSINESS_RULES.md, docs/RBAC_STANDARD.md, docs/CORE_RULES.md, docs/AUTH_RULES.md*
