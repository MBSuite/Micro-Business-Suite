# Architecture Decisions Log (Micro Business Suite)

บันทึก decision ระดับเทคนิค/สินค้าที่มีผลต่อโครงสร้างโค้ด — ใช้ประกอบการดูแลโปรแกรมของลูกค้า

## Template

### [YYYY-MM-DD] Decision Title
- Context:
- Decision:
- Alternatives considered:
- Why this was chosen:
- Impacted files/modules:
- Rollback plan:

### [2026-11-05] Company settings tenant isolation and credential-safe reads
- Context: Company settings were stored as a singleton and several pages/actions returned or modified settings without tenant ownership checks; server-rendered settings also included credential columns.
- Decision: Add `company_settings.company_id`, seed isolated non-secret defaults per company, preserve ambiguous legacy rows unassigned for manual ownership verification, and require tenant-scoped reads/writes. Only superadmins may manage system groups; non-superadmin admins cannot assign or remove protected groups.
- Alternatives considered: Copy the legacy singleton to every company (would disclose bank/OAuth credentials), or guess which tenant owns it.
- Why this was chosen: Keeps old data available without exposing it across tenants and makes ownership explicit.
- Impacted files/modules: company settings migration/bootstrap, registration and auth bootstrap, settings actions/APIs, invoice/expense/contact pages, group management API, integration test schema.
- Rollback plan: Revert application changes only after restoring the prior access controls; retain the additive migration and unassigned legacy row until ownership has been reviewed.

### [2026-11-06] Journal tenant isolation and company-scoped exports
- Context: Journal reads, writes, generated reference numbers, dashboard alerts, and Google Drive reports were not consistently scoped to the signed-in company.
- Decision: Add `journal_entries.company_id`, backfill it from linked invoices, expenses, and payments, require authenticated company context for journal operations, and scope dashboard/export queries and Drive folders by company.
- Alternatives considered: Keep shared journal records or assign unlinked legacy entries to a default company.
- Why this was chosen: Prevents cross-company disclosure while avoiding guessed ownership for unlinked historical journal rows.
- Impacted files/modules: journal migration/bootstrap, journal writer/actions, dashboard, expense import/actions, POS/invoice/voucher journal creation, Google Drive exports, integration schema.
- Rollback plan: Revert application changes only after restoring equivalent tenant checks; retain the additive migration and review any unassigned legacy journal rows before assigning ownership.

### [2026-11-06] Company-owned Google Drive connections and canonical superadmin roles
- Context: Google Drive initialization selected the first company settings row or fell back to global credentials, so company folders could still be created in another account's Drive. Legacy membership in group 1 could also grant superadmin privileges.
- Decision: Require each company admin to authorize the app through Google OAuth; store the verified Google account email and an AES-256-GCM encrypted per-company refresh token, with app credentials and a stable encryption key configured as server secrets. Clear legacy plaintext Google OAuth credentials once through a tracked bootstrap migration. Make `users.role = 'superadmin'` the only source of superadmin authority.
- Alternatives considered: Continue global OAuth/service-account fallback, or trust legacy group membership.
- Why this was chosen: Ensures each tenant's files are owned by the Google account that tenant connected and prevents stale group membership from granting administrative elevation.
- Impacted files/modules: Google Drive/Sheets clients and exports, OAuth connect/callback/disconnect routes, settings UI, company-settings migration, one-time legacy credential cleanup, permission checks, user group assignment, security integration tests, CORE_RULES.md.
- Rollback plan: Restore only with explicit tenant isolation and role-authority checks; do not re-enable global Google credential fallback or group-based superadmin elevation.

### [2026-11-06] Keep MBSuite.Dev separate and use Neon in Docker Compose
- Context: A duplicate clone of the separate `MBSuite.Dev` website was nested inside this Next.js repository, and Docker Compose configured an internal PostgreSQL service even though this app's configured database is Neon.
- Decision: Keep `MBSuite.Dev` at the sibling path `../MBSuite.Dev` only; exclude it from this app's TypeScript project. Docker Compose runs only the app and requires an externally supplied Neon `DATABASE_URL`; runtime uses the pooled URL, while migrations use a direct URL on a reviewed test branch first.
- Alternatives considered: Build both websites from this repository or keep a local PostgreSQL service in Compose.
- Why this was chosen: The websites have separate responsibilities and releases, and a single explicit database target prevents accidental divergence between `.env.local` and Compose.
- Impacted files/modules: `tsconfig.json`, `.gitignore`, `Dockerfile`, `docker-compose.yml`, README, agent guidance, and MBS project skills.
- Rollback plan: Restore the prior Compose file only if the owner explicitly chooses an on-premises PostgreSQL deployment; keep the two website repositories separate.

---

### [2026-11-05] Modular installable plugin packs + capability audit
- Context: ผู้ใช้ขอเพิ่มฟีเจอร์ 11 ข้อ (POS, inventory, analytics, CRM, employee, retail, F&B, cloud, on-prem, integrations, payment model) และขอแยกเป็น module แบบ install เพิ่มเติมได้.
- Decision: (1) ทำ Capability Audit จริงกับ codebase/DB → docs/CAPABILITY_AUDIT.md. (2) ขยาย MODULE_REGISTRY ด้วย module ids ใหม่ 11 ตัว (pos_checkout, promotions, sales_analytics, crm_loyalty, employee_sales, f_and_b, ecommerce_integration, delivery_integration, multi_branch, inventory_variants, offline_mode) ที่ toggle ต่อ company ได้ผ่าน company_module_settings. (3) เพิ่ม lib/plugin-packs.ts สำหรับ install แบบ pack (retail_pos, f_and_b, pharmacy, ...). (4) implement จริง 2 โมดูล: sales_analytics (API+page) และ pos_checkout (API+page พร้อม barcode input + multi-payment + stock deduction). (5) scaffold หน้า placeholder สำหรับโมดูลที่เหลือ.
- Alternatives considered: implement ทุกฟีเจอร์เต็มรูปแบบในรอบเดียว (ไม่ feasible).
- Why this was chosen: ตรวจสอบคุณสมบัติก่อนตามคำขอ; ใช้สถาปัตยกรรม module toggle ที่มีอยู่แล้ว; ship คุณค่าได้ทันที (analytics + POS) พร้อม roadmap.
- Impacted files/modules: lib/module-registry.ts, lib/plugin-packs.ts, app/api/reports/sales-analytics/route.ts, app/reports/sales-analytics/page.tsx, app/api/pos/checkout/route.ts, app/pos/page.tsx, scaffold pages (promotions, crm, reports/employee-sales, fb, integrations/*, branches, inventory/variants, offline), migrations (add_branches_table, add_product_variants_table, add_loyalty_tables, add_promotions_table), app/admin/modules/page.tsx, app/api/admin/modules/route.ts, docs/CAPABILITY_AUDIT.md.
- Rollback plan: revert commit; module entries ใหม่มี enabledByDefault false (ยกเว้น sales_analytics true) จึงไม่กระทบลูกค้าเดิม.
- Context: Role labels and access checks were inconsistent across UI/API.
- Decision: Standardize to `superadmin/admin/user` + group-based RBAC permissions.
- Alternatives considered: keep mixed role aliases for compatibility.
- Why this was chosen: reduces regressions, removes duplicate logic, improves maintainability.
- Impacted files/modules: `lib/core-standards.ts`, admin/member/API access checks, docs.
- Rollback plan: none needed; this is additive/normalization without schema destruction.

### [2026-04-09] Governance Guardrails Automation
- Context: Behavior changes risk drifting from docs and standards over time.
- Decision: Add CI/PR/weekly enforcement and guard tests.
- Alternatives considered: manual review-only process.
- Why this was chosen: lowers human error, keeps documentation synchronized with code.
- Impacted files/modules: `.github/workflows/*`, `scripts/verify-knowledge-sync.mjs`, `scripts/weekly-consistency-audit.mjs`, `tests/governance-guards.test.mjs`.
- Rollback plan: remove workflow/script/test files if automation causes false-positive friction.

### [2026-04-09] Unified Module Registry and Menu API
- Context: Sidebar menu and permission modules were defined in multiple files and drifted over time.
- Decision: Introduce a canonical module registry and expose it through a modules API.
- Alternatives considered: keep local constants per page.
- Why this was chosen: enables future module onboarding (HR, Sales, external APIs) without duplicating menu/permission definitions.
- Impacted files/modules: `lib/module-registry.ts`, `components/Sidebar.tsx`, `app/admin/groups/page.tsx`, `app/api/modules/route.ts`.
- Rollback plan: revert to static menu constants if dynamic module model causes UI regressions.

### [2026-09-21] PDF Evidence Must Be Checked Before Recording Expenses
- Context: บันทึกค่าใช้จ่ายโดยอ้างตัวเลขจากความทรงจำ/การประมาณ เสี่ยงตัวเลขภาษีเพี้ยน
- Decision: ก่อนบันทึกค่าใช้จ่ายทุกครั้ง ต้องอ่าน PDF ต้นทาง (invoice/statement) ก่อน แล้วบันทึกตัวเลขตามหลักฐานเท่านั้น ห้ามเดา
- Why this was chosen: หลักฐานตรวจสอบย้อนหลังได้, ตัวเลขภาษีถูกต้อง
- Impacted files/modules: `docs/BUSINESS_RULES.md`, พฤติกรรมการบันทึก expenses
- Rollback plan: none — เป็นกฎการทำงาน ไม่กระทบ schema
---

### [2026-11-05] กลุ่มใหญ่: Promotions, CRM Loyalty, Multi-Branch, F&B, Connectors
- Context: ผู้ใช้ขอทำกลุ่มใหญ่ก่อน commit
- Decision: Implement จริง 5 โมดูล + migrations 7 ไฟล์ + APIs + pages
- Impacted files/modules: lib/promotions.ts, lib/loyalty.ts, app/api/promotions/*, app/api/crm/*, app/api/branches/*, app/api/fb/*, app/api/integrations/*, pages (promotions, crm, branches, fb, integrations/*), migrations (add_branches_table, add_product_variants_table, add_loyalty_tables, add_promotions_table, add_branch_stock_table, add_fb_tables, add_integration_connections)
- Rollback plan: migration files ใช้ IF NOT EXISTS, ปลอดภัย; code changes revert ได้

---

### [2026-11-07] Bridge/Sync + Auth + Tenant model สำหรับ MBSuite platform
- Context: HANDOFF.md section 9 ระบุ 3 คำถามที่ต้องยืนยันก่อนเริ่ม Phase 3 (Bridge/Sync). ผู้ใช้ยืนยันทั้ง 3 ข้อใน session นี้.
- Decision:
  1. Sync endpoint: **สร้าง `/api/bridge/sync` ใหม่** (loose coupling, versioning, idempotency, batch sync, retry) — ไม่แตะ `/api/integrations/webhook` เดิม (legacy e-commerce/delivery)
  2. Auth: **JWT เดียวกัน (SSO)** ผ่าน MBS Core — Suite ใช้ shared token
  3. Tenant: **multi-tenant `company_id` เดียวกัน** ระหว่าง MBS Core + Suites (tenant isolation ผ่าน RLS/filter) — ไม่แยก DB ต่อ company
- Alternatives considered: ใช้ `/api/integrations/webhook` ที่มีอยู่; แยก auth ต่อ Suite; แยก database ต่อ company.
- Why this was chosen: ลด coupling, ใช้ auth/tenant model ที่มีอยู่แล้ว, ไม่เพิ่ม infra; สอดคล้องกับ constraint "ไม่เปลี่ยนแปลง MBS Core" (Bridge เป็น plugin/module layer).
- Impacted files/modules: `app/api/bridge/sync` (ใหม่), `lib/auth.ts` (อ่าน shared JWT, ไม่แก้ core), `lib/db.ts` (tenant filter), `lib/module-registry.ts`, `lib/plugin-packs.ts`, Suite standalone apps (Micro-Menu-Online เป็น priority).
- Rollback plan: revert commit ของ bridge route + plugin layer; endpoint ใหม่เป็น additive ไม่แตะ core/webhook เดิม, จึง rollback ได้โดยไม่กระทบ MBS Core.

### [2026-11-07] ข้อมูลสำรวจ (exploration findings)
- Micro-Menu-Online (priority Suite) อยู่ที่ `services/next/01-PRODUCTS-BUSINESS/Micro-Menu-Online` (และ `Micro-Menu-Online-V2`) — ยังไม่ได้ inspect ภายใน.
- Local `.env.local` ของ Micro-Business-Suite target Neon branch `ep-delicate-base-b31rx7ol` (region ap-southeast-1), DB `neondb`, user `neondb_owner`, มีทั้ง pooled + unpooled hosts (migration ใช้ unpooled). ไฟล์มี duplicate DB blocks + trailing Vercel OIDC token.
- Git status (Micro-Business-Suite): branch `main`, up to date with origin/main, working tree มี untracked 1 ไฟล์ = `docs/HANDOFF.md` (ยังไม่ commit).
- Safety: ห้ามรัน migration/seed โดยไม่ backup + owner approval; verify Neon branch ก่อน write.

### [2026-11-08] แผน License กลางและสิทธิ์แยกรายผลิตภัณฑ์
- Context: ปัจจุบัน `app/admin/customers` มี Customer & Subscription Console สำหรับ superadmin ให้ออก/ต่อ License ผ่าน UI และ `app/api/admin/customers/[id]/license` ออก key ที่มี `product: "micro-business-suite"` พร้อม tier, features และ limits ของ Core; ยังไม่มี entitlement ที่ระบุสิทธิ์ของ 6 โมดูล Suite อย่างชัดเจน. มี CLI issuer ใน `scripts/issue-license*.mjs` ด้วย. การเปิด/ปิดเมนูใน Admin Modules เป็นการตั้งค่าโมดูลภายใน Core ไม่ใช่ License ของแอป standalone ทั้งหก.
- Decision: เพิ่มงานออกแบบ/พัฒนา License management ในแผน โดยยึด **สัญญา/บัญชี License หนึ่งชุดต่อบริษัท และ entitlement แยกตามผลิตภัณฑ์** ได้แก่ Core, Service, Retail, Rental, Pharmacy, Hotel และ F&B. Admin ต้องกำหนดผลิตภัณฑ์ที่เปิดใช้, tier/features, ขีดจำกัดที่เหมาะกับแต่ละโมดูล, วันเริ่ม/หมดอายุ และสถานะ; รองรับออก ต่ออายุ ระงับ/เพิกถอน และตรวจประวัติ. Key หรือ activation token ที่แต่ละแอปตรวจต้องจำกัด `company_id` และ `product/module` ใน claims เพื่อป้องกันการนำสิทธิ์ของโมดูลหนึ่งไปใช้กับอีกโมดูล. โมดูลต้องตรวจสิทธิ์ฝั่ง server และรองรับการใช้งาน standalone ตามนโยบาย License ที่อนุมัติ.
- Security requirements for the design: ห้ามใช้ signing secret ร่วมติดตั้งใน Core และทุกโมดูล; ให้ออกแบบลายเซ็นที่โมดูลตรวจสอบได้โดยไม่มีสิทธิ์ออก key (เช่น asymmetric signing). เก็บประวัติการออก/เปลี่ยนสิทธิ์โดยไม่แสดง key เต็มซ้ำในหน้ารายการ และกำหนดแนวทาง revoke/หมดอายุที่เหมาะกับการทำงาน standalone.
- Alternatives considered: ใช้ key เดียวที่ให้สิทธิ์ทุกผลิตภัณฑ์โดยปริยาย; หรือให้ลูกค้าจัดการ key คนละชุดโดยไม่มี License/บัญชีกลาง.
- Why this was chosen: ให้ลูกค้าจัดการการซื้อในระดับบริษัทได้ง่าย พร้อมควบคุมและตรวจสอบสิทธิ์รายผลิตภัณฑ์ได้ และลดผลกระทบหาก key ของโมดูลใดรั่ว.
- Impacted files/modules: Core `app/admin/customers`, License API/verification และ schema/audit history; แอป standalone ทั้งหกสำหรับตรวจสิทธิ์ของผลิตภัณฑ์ตนเอง; เอกสารการออกและติดตั้ง License.
- Status / approval boundary: **เป็นแผน ยังไม่มีการเปลี่ยนโค้ดหรือ schema ในรายการนี้**. ต้องยืนยันรูปแบบแพ็กเกจ/limits, วิธีทำงานเมื่อขาดการเชื่อมต่อหรือถูกเพิกถอน, และนโยบาย License ของแต่ละโมดูลก่อน implementation. หากเพิ่ม/แก้ schema ให้ทดสอบ migration บน Neon branch แยกที่ตรวจ target แล้ว และขออนุมัติก่อน production migration.
- Rollback plan: ยังไม่เกี่ยวจนกว่าจะอนุมัติและเริ่ม implementation; การเปลี่ยนแปลงในอนาคตควรเพิ่มแบบ backward-compatible และมีแผนรองรับ/ย้าย Core License เดิมก่อนเปิดใช้ entitlement enforcement.
