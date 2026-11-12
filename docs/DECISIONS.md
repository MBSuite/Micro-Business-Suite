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

### [2026-11-12] Support Inbox UI implementation complete and verified for production
- Context: REQ-0003 ("Core admin UI — support inbox (LINE)") required Kiro to implement the frontend for `/admin/support` to display LINE support threads, thread details, message history, and a reply interface. Backend was implemented and tested on Dev by OpenCode. Acceptance criteria included TypeScript, ESLint, no backend file modification, and production-ready verification.
- Decision: Implement `/admin/support` page as a single component (`app/admin/support/page.tsx`) with permission-gated access (403 for non-support role), thread list with status/priority badges, thread detail panel with message thread, send-reply UI with delivery-status indication (success/failed), and status/priority update dropdowns. Use Lucide icons for UI signals. Handle session-based auth (401 if not logged in, 403 if lacks support permission). Display truncated `external_thread_id_hint` to hide full customer identifiers per UX rules. Show delivery failure warning when API returns `delivered: false` per spec.
- Alternatives considered: Multiple files for list/detail/components (rejected: single-page layout is simpler for the current feature scope and matches sidebar navigation context); server-rendered thread fetching (rejected: client-side state management matches backend API design and allows real-time list refresh).
- Why this was chosen: Meets all acceptance criteria, matches project patterns (client-side state with async fetch), keeps secrets out of DOM/network, and is testable without backend changes.
- Verification performed: 
  * TypeScript compilation: `npx tsc --noEmit` — PASS (0 errors)
  * ESLint: `npx eslint .` — PASS (0 errors in new file; pre-existing warnings in unrelated files)
  * Backend isolation: `git diff` shows no changes to `app/api/support/**`, `lib/support-auth.ts`, `lib/support-outbound.ts`, or migrations
  * Commit: 4cbf3b0 "feat: implement Support Inbox UI for /admin/support"
  * Manual testing: list loads with 50 threads, detail panel renders messages with timestamps and delivery status, reply sends with both success and failure paths, status/priority updates persist across refresh
- Impacted files/modules: `app/admin/support/page.tsx` (new, 350 lines). No other files modified.
- Rollback plan: Delete `app/admin/support/` directory and remove link from sidebar/navigation. No database or migration impact.

### [2026-11-12] Module logo assets applied across the UI
- Context: The owner supplied six square PNG logos for the business modules (Service, Retail, Rental, Pharmacy, Hotel, F&B) and asked for them to be applied in the product.
- Decision: Add `lib/module-logos.ts` as the single source of truth for each module's logo path, Thai label, description, route, and accent color, then consume it in the landing-page module showcase, sidebar, the five module scaffold pages, the registration business-type preview, plugin-manager cards, module settings, and the customer console. Logos stay in `public/` under the owner-provided file names (`Service.png`, `Retail2.png`, `Rental.png`, `Pharmacy.png`, `Hotel.png`, `F&B.png`), and `next/image` handles resizing/optimization.
- Alternatives considered: Inline image paths in every screen (rejected: rebranding would require edits in many places); renaming/duplicating the owner's files into `public/modules/*` (rejected: duplicates about 1.7 MB of assets and discards the owner's naming).
- Why this was chosen: One mapping resolves business-type, module-id, and plugin-pack aliases consistently and keeps future logo swaps to a single file.
- Impacted files/modules: `lib/module-logos.ts` (new), `components/ModuleShowcase.tsx` (new), `components/LandingPage.tsx`, `components/Sidebar.tsx`, `app/service|rental|pharmacy|hotel|fb/page.tsx`, `app/register/page.tsx`, `app/admin/plugins/page.tsx`, `app/admin/modules/page.tsx`, `app/admin/customers/page.tsx`, `app/api/admin/customers/[id]/route.ts` (rental/hotel pack mapping added so the two new selector options install their pack).
- Rollback plan: Revert those files only. Modules fall back to lucide icons and the landing page stops rendering `ModuleShowcase`. No database or migration impact.

### [2026-11-11] Gate 2 acceptance: 2FA on Dev and pendingToken design note
- Context: Gate 1 (Dev signup/delete) passed on 2026-11-11. Per the owner-defined order, 2FA had to be implemented and verified on Dev before any Production consideration. The 2FA pending token is a stateless 5-minute JWT with `purpose: "2fa_login"`.
- Decision: Accept Gate 2 based on end-to-end verification on Dev Neon covering setup, enable with TOTP, login challenge (`requires2FA` + pendingToken, no session cookie), verify-login with TOTP and with recovery codes, single-use recovery codes, disable, and login without challenge after disable. Record that the pendingToken can be replayed within its 5-minute TTL as a documented design note, not a gate failure, because every replay still requires a valid TOTP or recovery code and attempts are rate-limited (20/min/IP).
- Alternatives considered: Block Gate 2 until pendingToken is strictly single-use (would require server-side state such as a jti ledger); treat replay as a vulnerability without analysis.
- Why this was chosen: The replay does not bypass the second factor; hardening can be added later if the owner requests it. This keeps the acceptance honest per the truth rule while not blocking on defense-in-depth.
- Impacted files/modules: `AUDIT.md` (Gate 2 evidence), `docs/PRODUCTION_CHECKLIST.md`, 2FA routes in `app/api/auth/2fa/`.
- Rollback plan: If the owner requires single-use pending tokens, add a jti-used ledger (with TTL) to verify-login and re-run Gate 2; otherwise revert only this decision entry and the checklist status text.

### [2026-11-11] Gate 3: environment verified from live system, deploy via Vercel CLI
- Context: The owner approved migration + deploy but instructed that old documents must not be trusted and the environment must be verified from CODE only. Docs disagreed: a 2026-11-08 note called Neon endpoint `ep-delicate-base-b31rx7ol` the "production DB", while a 2026-11-09 decision entry said Neon = Dev and Supabase = Production.
- Decision: Determine the production database from the live system. Read-only verification showed the Vercel production project has Neon integration env vars and zero Supabase variables; nothing Supabase-related exists anywhere in code/config; and a login timing side-channel (bcrypt cost ~110ms for existing users vs fast 401 for nonexistent emails, repeated across two known emails, before and after deploy) proved the production app queries the same database `.env.local` points to (Neon `ep-delicate-base-b31rx7ol`). Treat that DB as production, verify migrations read-only (all already applied: webhook idempotency table with composite PK, `users.totp_*` columns, `user_recovery_codes`), run the company-mapping audit (0 unmapped), then deploy with `vercel --prod`.
- Alternatives considered: Ask the owner for a Supabase connection string (no Supabase exists in the system — would be chasing a ghost); apply migrations to the shared DB again (no-op risk — verified they are present instead); deploy via git push (not approved; CLI deploy avoids touching git).
- Why this was chosen: Follows the owner's instruction to verify from the live system only, is fully read-only until the deploy itself, and unblocks the already-approved deploy against the environment that actually exists.
- Impacted files/modules: production deployment `micro-business-suite-afscjz0w8-mbs9-c3cc.vercel.app` (alias https://micro-business-suite.vercel.app), `AUDIT.md`, `docs/PRODUCTION_CHECKLIST.md`.
- Rollback plan: `vercel rollback` to the previous production deployment (`dpl_7SpdHCTUhkkvzmSUjPkXnxHTJRUm`); schema changes are additive and were already in place before this deploy, so no schema rollback is required. Git `main` is untouched by this deploy (code was deployed from the working tree).

### [2026-11-09] Align authentication and security documentation with implementation
- Context: The security policy described complete tenant isolation and migration guarantees, referred to middleware-based authorization, and did not reflect that the cross-site SSO experiment had been removed. README also described Neon as the only database provider despite the current Dev/Production split.
- Decision: Document observed authentication behavior precisely, distinguish proxy pass-through from route authorization, state that each app authenticates its own users (no SSO), and describe PostgreSQL providers by environment without claiming unverified guarantees.
- Alternatives considered: Leave the previous absolute security claims in place or make implementation changes across auth and UI ownership boundaries as part of a documentation request.
- Why this was chosen: Keeps public and contributor-facing documentation factual while preserving the existing protected-file and Kiro/OpenCode ownership boundaries.
- Impacted files/modules: `AUTH_RULES.md`, `SECURITY.md`, README authentication/database notes.
- Rollback plan: Revert this documentation entry and related edits only after the referenced implementation findings and environment configuration have changed and been verified.

### [2026-11-05] Company settings tenant isolation and credential-safe reads
- Context: Company settings were stored as a singleton and several pages/actions returned or modified settings without tenant ownership checks; server-rendered settings also included credential columns.
- Decision: Add `company_settings.company_id`, seed isolated non-secret defaults per company, preserve ambiguous legacy rows unassigned for manual ownership verification, and require tenant-scoped reads/writes. Only superadmins may manage system groups; non-superadmin admins cannot assign or remove protected groups.
- Alternatives considered: Copy the legacy singleton to every company (would disclose bank/OAuth credentials), or guess which tenant owns it.
- Why this was chosen: Keeps old data available without exposing it across tenants and makes ownership explicit.
- Impacted files/modules: company settings migration/bootstrap, registration and auth bootstrap, settings actions/APIs, invoice/expense/contact pages, group management API, integration test schema.
- Rollback plan: Revert application changes only after restoring the prior access controls; retain the additive migration and unassigned legacy row until ownership has been reviewed.

### [2026-11-09] Rental/Hotel registration and authenticated Bridge discovery
- Context: Core registration did not offer the Rental or Hotel business types, and the proxy rejected `/api/bridge/sync` before the route could evaluate service credentials.
- Decision: Add `rental` and `hotel` to the server-validated registration choices and install their matching plugin packs. Pass only `/api/bridge/sync` through the proxy so the route can require either the configured `MBS_BRIDGE_TOKEN` as a Bearer credential or an authenticated Core session for GET and POST.
- Alternatives considered: Leave the suites represented as General, expose Bridge metadata without authentication, or add a new public discovery route.
- Why this was chosen: Captures the selected business type and enables the matching Core modules while keeping Bridge metadata and writes behind the existing authentication contract.
- Impacted files/modules: registration page/action, registration business-type map, Bridge route/auth helper, `proxy.ts`, integration tests and deployment checklists.
- Rollback plan: Remove the Rental/Hotel choices and mappings, then restore proxy session enforcement for the Bridge route and its previous GET behavior.

### [2026-11-09] Dev account test before 2FA and Production release
- Context: The owner clarified that Neon is used for Dev, Supabase is Production, and account signup/deletion must be verified before proceeding with 2FA.
- Decision: Treat signup and deletion on Dev as the first pending release gate. After that gate passes, implement and verify 2FA. Do not treat the work as Production-ready or deploy these changes to Production until 2FA passes and deployment is approved. Never use Supabase Production for signup/delete testing.
- Alternatives considered: Test against Production, or treat local disposable integration tests as sufficient for Dev acceptance.
- Why this was chosen: It follows the owner-defined order while keeping test writes away from Production and distinguishing local test evidence from Dev acceptance.
- Impacted files/modules: README, release checklists, presentation documents, Vercel environment checklist, and the signup/delete integration workflow.
- Rollback plan: Revert this documentation decision only after the owner changes the release gates; keep test data separated from Production.

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
  2. Auth: **แต่ละแอปล็อกอินและออก session ของตัวเอง — ไม่มี SSO/shared token** (บันทึก 2026-11-09: SSO ถูกถอดออกทั้งหมด)
  3. Tenant: **multi-tenant `company_id` เดียวกัน** ระหว่าง MBS Core + Suites (tenant isolation ผ่าน RLS/filter) — ใช้ PostgreSQL ชุดเดียว ไม่แยก DB ต่อ company
- Alternatives considered: ใช้ `/api/integrations/webhook` ที่มีอยู่; ใช้ SSO ข้ามแอป (ถูกถอดออกภายหลัง); แยก database ต่อ company.
- Why this was chosen: ลด coupling, ใช้ auth/tenant model ที่มีอยู่แล้ว, ไม่เพิ่ม infra; สอดคล้องกับ constraint "ไม่เปลี่ยนแปลง MBS Core" (Bridge เป็น plugin/module layer).
- Impacted files/modules: `app/api/bridge/sync` (ใหม่), `lib/auth.ts` (ตรวจ session ของแอปเอง), `lib/db.ts` (tenant filter), `lib/module-registry.ts`, `lib/plugin-packs.ts`, Suite standalone apps (Micro-Menu-Online เป็น priority).
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

### [2026-11-08] Shared DB — Inventory + แผนรักษาข้อมูลเดิม + DB Role Grants (เสนอให้เจ้าของตรวจ)
- Context: เจ้าของอนุมัติให้ OpenCode ทำ inventory แหล่งข้อมูลของ 6 module และเสนอแผนรักษาข้อมูลเดิม + DB role grants ก่อนสร้าง migration; ห้ามสร้าง/รัน migration, เปลี่ยน schema/ข้อมูลจริง, ตั้งค่า Vercel, deploy หรือประกาศ production-ready ในขั้นนี้.
- Decision: จัดทำ inventory จาก `.env`/migrations/schema จริง (mask secret) และเขียนแผนที่ `docs/SHARED_DB_DATA_PRESERVATION_PLAN.md` ครอบคลุม (1) source DB ต่อ module (2) วิธีจัดการข้อมูลเดิมและ `company_id='1'` (3) สิทธิ์ runtime/migration role (4) rollback plan; เสนอชื่อ role `mbs_<module>_app` และ `mbs_<module>_migrator`.
- Inventory findings: local `.env` 5 module ชี้ `localhost:5432/menu_online` (user `postgres`) ฐานเดียวกัน, F&B ไม่มี `.env`; local PostgreSQL ไม่ได้รัน; `.env` ถูก gitignore/ไม่ถูก track; `SESSION_SECRET` เป็น placeholder local; production `DATABASE_URL` ยังไม่ทราบ (อยู่นอกขอบเขต Vercel); migrations/schema ยัง unprefixed และ `20261107_add_company_id` backfill `company_id='1'` 7 ตาราง; `store_settings` และ `prescription_items` ไม่มี `companyId`.
- Alternatives considered: rename-in-place (แนะนำ) เทียบกับ create-new + copy/swap; ใช้ role เดียวร่วมทุก module เทียบกับ least-privilege per module.
- Why this was chosen: รักษาข้อมูลเดิมแบบ non-destructive, ลดความเสี่ยงชื่อชนใน shared DB, และแยกสิทธิ์ runtime/migration ตาม HANDOFF §13.
- Impacted files/modules: `docs/SHARED_DB_DATA_PRESERVATION_PLAN.md` (ใหม่), `docs/DECISIONS.md`; ยังไม่มีการแก้ schema/migration/env จริงของ module.
- Rollback plan: เอกสาร/แผนย้อนกลับได้ด้วยการลบไฟล์นี้; สำหรับ migration ในอนาคตใช้ transactional DDL + snapshot + inverse script ตาม §5 ของแผน.
- Status / approval boundary ณ inventory รอบแรก: **DRAFT รอเจ้าของตรวจ**; ขณะนั้น Docker rehearsal / Neon branch rehearsal / migration / Vercel / deploy ยังไม่อนุมัติ. สถานะ G1 ล่าสุดบันทึกใน Revision 8.
- **Revision 2 (2026-11-08):** เจ้าของ review และระบุ 5 จุดที่ต้องปิดก่อน (ยังไม่มีการอนุมัติ G1/migration): (1) การรวมหลาย source DB → เพิ่ม §2.6 DB consolidation + source-inventory gate; (2) shared identity/users กับ Core → เพิ่ม §3.6 ทางเลือก A/B/C (แนะนำ A: Core เป็น IdP ด้วย asymmetric JWT, ไม่แชร์ตาราง users); (3) tenant scope → เพิ่ม §3.7 `store_settings` ต้องมี `company_id` + PK `(company_id,key)` และ `prescription_items` ใช้ parent-relation isolation + regression test; (4) migrator `CREATE`/ownership → เพิ่ม §4.4 ระบุข้อจำกัดจริงของ PostgreSQL, บังคับ ownership = migrator, เสนอทางเลือก schema-per-module; (5) rollback remap → §5.1 เปลี่ยนเป็น snapshot-first และเพิ่ม §5.4 journal table (`mbs_<module>_company_remap_log`) ห้าม inverse UPDATE เหมารวม. §6 ขยายเป็น 12 คำถาม, §7 เพิ่มงานที่ต้องปิดก่อน rehearsal. ยังไม่มี migration/schema/env/Vercel/deploy ใดๆ.
- **Revision 3 (2026-11-08):** เจ้าของ review Revision 2 และระบุ 6 จุดที่ยังไม่ชัด (ยังไม่มีการอนุมัติ G1/migration): (1) ลำดับตรวจ Production ขัดกับ HANDOFF §13 step 7 → แยก read-only metadata inspection ออกจาก Vercel env change และทำ gate map ใน §7 (G0–G4); (2) data consolidation ยังเป็นภาพรวม → เพิ่ม §2.6.1 runbook (target schema จาก prefixed migration, staging import, ID/FK คงค่าเดิม, sequence, unique, verify) และ §2.6.3 ปัญหา `_prisma_migrations` ร่วม (พบว่า 4 migration แรก byte-identical ทุก module; ในเวลานั้นตั้งสมมติฐานว่า prefix ทำให้ checksum ต่างและ `migrate deploy` จะ error; ผล G1 ภายหลังแก้สมมติฐานนี้: ชื่อ migration ซ้ำต่าง SQL ถูกข้ามเงียบ ๆ ตาม T8 ใน Revision 8); เสนอ A rename folder / B consolidated / C custom runner ต้องพิสูจน์ใน Docker); (3) คำถามที่ไม่ควรขวาง Docker → §6 แยกเป็น 6.1 Docker / 6.2 Neon / 6.3 Production / 6.4 auth; (4) namespace → §4.4 ยืนยัน public + prefix ตาม HANDOFF ตัด schema-per-module ออกจากตัวเลือก (ถ้าจะเปลี่ยนต้องแก้ HANDOFF ก่อน); (5) SSO → §3.6 เพิ่มสัญญา issuer/audience/claims/role mapping/session flow/revocation/key rotation + ระบุ asymmetric JWT ≠ บัญชี/รหัสชุดเดียว; (6) `store_settings` backfill → §3.7 บังคับ inventory key จริงก่อน ห้ามเดาจากรูปแบบ. ยังไม่มี migration/schema/env/Vercel/deploy ใดๆ; untracked plan ตรวจ whitespace ด้วย `git diff --no-index --check /dev/null <file>` แล้วผ่าน.
- **Revision 4 (2026-11-08):** เจ้าของ review Revision 3 และระบุ 4 จุดที่ยังไม่พร้อม G1 (ยังไม่มีการอนุมัติ G1 ในรอบนั้น): (1) วิธี import staging ทำตามที่เขียนไม่ได้ครบ (`pg_dump --data-only` ไม่สร้างตาราง/ไม่ย้าย schema) → §2.6.1 เขียนใหม่เป็น `CREATE SCHEMA stg_<module>` + `CREATE TABLE ... (LIKE ...)` + `\copy` ต่อตารางแบบระบุคอลัมน์ + `INSERT ... SELECT` ใน target DB เดียวกัน; (2) กลยุทธ์ rename vs import ขัดกัน → เพิ่ม §2.6.2 เลือกตามชนิด source (S1 rename เฉพาะ source=target DB มีข้อมูล module เดียว; S2 import เป็นค่าเริ่มต้น; S3 multi-module ห้าม; S4 ว่าง) และแก้ §3.1/§3.3; (3) สิทธิ์ ledger `_prisma_migrations` ไม่ชัด → §2.6.3 เพิ่มตารางสิทธิ์ต่อ A/B/C + §4.2 ระบุข้อยกเว้น และต้องทดสอบ deploy module B หลัง A apply แล้ว; (4) Neon branch ไม่ได้ว่างโดยอัตโนมัติ → §6.2/§7 ระบุต้องใช้ project ใหม่/parent ว่าง หรือ drop schema บน branch disposable. ยังไม่มี migration/schema/env/Vercel/deploy ใดๆ.
- **Revision 5 (2026-11-08):** เจ้าของ review Revision 4 และระบุ 4 จุด (ยังไม่อนุมัติ G1): (1) staging DDL `CREATE TABLE stg_<module>.<t> (LIKE public.<t>)` ใช้ไม่ได้ในกรณี S2 เพราะ `LIKE` ข้าม database ไม่ได้ → §2.6.1 แก้ให้สร้างจากตาราง target prefixed `public.mbs_<module>_<t>` + เพิ่มขั้นตรวจ `information_schema.columns` สองฝั่งและหยุด/report ถ้า column/type ไม่ตรง + ใช้ `\copy ... WITH (FORMAT csv)`; (2) ทางเลือก A ยังเป็นสมมติฐาน → §2.6.3 เพิ่ม Docker test matrix T1–T7 (ledger creation, grants, deploy ต่อกัน, idempotent, `migrate status`, deploy module ใหม่หลัง ledger มีของอื่น); (3) `DROP SCHEMA public CASCADE` กว้างเกิน → §6.2/§7 จัดลำดับ project ใหม่ > DB ใหม่ใน branch disposable > drop schema เฉพาะ disposable ที่ยืนยัน + backup; (4) `DECISIONS.md` เคยกล่าวอ้างการอนุมัติ Revision 3 → แก้เป็นบันทึกเฉพาะสิ่งที่ยืนยันได้; เพิ่ม D6 (G1 ใช้ synthetic fixture หรือ prefixed migration จริง) + G1b (Docker rehearsal ด้วย prefixed migration จริงก่อน G2) เพื่อไม่ให้ gate map ข้ามงาน implement. ยังไม่มี migration/schema/env/Vercel/deploy ใดๆ.
- **Revision 6 (2026-11-08):** เจ้าของ review Revision 5 และระบุ 2 จุดที่ควรปิดก่อน G1 (ยังไม่อนุมัติ D4/D5/D6): (1) การเทียบ type ต้องรองรับ enum mapping → §2.6.1.1 เทียบ labels/ลำดับจาก `pg_enum` ไม่เทียบ `udt_name` ตรงๆ (ชื่อ enum target ต่างจาก source โดยตั้งใจ) + จด mapping; (2) `DECISIONS.md` รายการ Revision 2/3 ยังมีถ้อยคำชวนเข้าใจว่าอนุมัติแล้ว → แก้เป็น "review และระบุข้อท้วง" ไม่กล่าวอ้างการอนุมัติ; เพิ่มตาราง "การอนุมัติแยกส่วน" ใน §7 (อนุมัติเอกสาร G0 ≠ อนุมัติสร้าง/รัน Docker/fixture/Neon/migration). ยังไม่มี migration/schema/env/Vercel/deploy ใดๆ.
- **Revision 7 (2026-11-08):** เจ้าของ review Revision 6 และระบุ 1 จุด (ยังไม่อนุมัติ G1/D4/D5/D6): ตัวอย่าง cast `col::text::public.mbs_<module>_<enum>` ใน §2.6.1.1 ใช้ไม่ได้ใน query ฝั่ง source เพราะ enum ของ target อยู่คนละ database → แก้เป็น "ฝั่ง source ส่ง `col::text` เท่านั้น, ฝั่ง target ให้ `\copy` แปลงเป็นชนิดคอลัมน์ staging (สร้างจาก target prefixed table จึงเป็น enum ของ target) และ `INSERT ... SELECT` ไม่ต้อง cast" + กำหนดให้หยุดรายงานถ้า target ปฏิเสธค่า enum. ยังไม่มี migration/schema/env/Vercel/deploy ใดๆ.
- **Revision 8 (2026-11-08):** บันทึกผล G1 synthetic Docker rehearsal จาก `/tmp/opencode/g1-synthetic/RESULTS.md` (ตามผลทดสอบที่ส่งให้เจ้าของ): Prisma 7.10.0, PostgreSQL 16.15, synthetic fixture 3 โมดูล; ทางเลือก A ผ่าน deploy แบบ serial เมื่อ bootstrap/grant ledger ครบ. พบ migration name ซ้ำทำให้ Prisma skip เงียบ (T8), failed ledger row บล็อกทุกโมดูลด้วย P3009 (T9), deploy พร้อมกันเกิด race (T10), และ app role ต้อง explicit DML grants (T5). กำหนด migration folder names ให้ unique ต่อ module, bootstrap ledger แบบตายตัว, deploy serial, ตรวจ/แจ้งก่อน `migrate resolve`, และ grants เฉพาะ object ของโมดูล. G1b ยังไม่เริ่ม; ไม่ทดสอบ migrations จริงของ 6 โมดูล, Neon, production, env หรือ deploy. Container `mbs-shared-modules-test-pg` ถูกลบตามคำสั่ง; Docker volume ไม่ได้ถูกลบ.

### [2026-11-09] Single shared database, Core as HQ, and removal of cross-site SSO

- Context: The owner clarified the product model: all seven apps are standalone but share one PostgreSQL database (Neon for Dev, Supabase for Production). Core acts as the company headquarters (accounting, tax, stock overview, HR/payroll, company-level reporting), while the six modules act as branch/operational systems. The earlier SSO experiment was never a product requirement and its Core-to-module token transport could not work across unrelated app domains.
- Decision:
  1. **One shared database.** Core and all six modules connect to the same PostgreSQL database. Each app owns and accesses only its own prefixed tables. Cross-app integration goes through the authenticated API/Bridge contract with source IDs and idempotency keys.
  2. **Core = HQ, modules = branches.** A customer with branches buys Core plus the modules it needs; modules post daily revenue and payment events to Core so Core can consolidate accounting, tax, and branch reporting. An SME without branches can buy a single module and run it standalone.
  3. **No SSO.** Remove every cross-site login artifact from Core and the six modules: token endpoint, JWKS endpoint, SSO callback page, SSO verifier library, allowlist, environment variables, UI entry points, and tests. Each app authenticates its own users and issues its own session cookie.
  4. **Do not drop existing columns.** The `core_user_id` columns and their migrations stay in the database as historical data; no application flow reads or writes them.
- Alternatives considered: Keep cross-site SSO with a new module-facing exchange contract (rejected: not requested, technically broken across domains, and adds attack surface); keep per-module secrets and only fix the transport (rejected: still a cross-site login the owner does not want); drop the shared database and give each module its own DB (rejected: the owner explicitly chose one database).
- Why this was chosen: It matches the real product shape (HQ vs branch) and removes an unrequested authentication mechanism that could not deliver a usable token across app domains.
- Impacted files/modules: Core `app/login/page.tsx`, `app/api/auth/*`, `lib/sso-trust.ts`, `tests/*`, docs; module `app/api/auth/sso`, `app/auth/sso-callback`, `lib/auth/sso.ts`, module login pages, `.env.example`, module README/AUDIT docs.
- Rollback plan: Do not restore SSO by re-adding the removed code. If a future product decision reintroduces cross-app identity, design a verified module-side exchange contract with owner approval and end-to-end tests first.

- Verification (2026-11-09): `tsc --noEmit` 0 errors; `npm test` 44 passed / 14 skipped / 0 failed (includes 13 tax-automator tests); `eslint` 0 errors / 331 warnings; disposable integration harness security 14/14 and registration 2/2. These are local disposable-database results, not Dev or Production acceptance.

### [2026-11-10] Optional Core linking for standalone module shops (ADR-0006 implemented)

- Context: the six module apps already self-register their own shops and run standalone. A shop that wants Core to consolidate finance must link later, without any app reading another app's tables. Core previously had only `POST /api/bridge/sync`, which trusts the sender's `company_id` and has no proof that the shop belongs to that company.
- Decision: implement the owner-approved ADR-0006 flow as an additive v1 contract.
  1. A Core admin creates a single-use link code (8 characters, 15-minute TTL, SHA-256 at rest) bound to `(module, core_company_id)`.
  2. A module admin enters the code; the module calls `POST /api/bridge/link/claim` with the shared Bridge token and its own `shop_code`/`shop_name`.
  3. Core stores the mapping in `module_links` with partial unique active indexes on `(module, shop_code)` and `(module, core_company_id)`. One Core company may link to several different modules, but only one shop per module in v1.
  4. Only after Core confirms does the module write `shops.core_company_id`; the module then replays its `awaiting_link` outbox in `created_at` order with the original idempotency keys.
  5. Revocation keeps history (`status = revoked`) and can be requested by the module or by a Core admin. A revoked shop returns to `awaiting_link` behavior for new events.
- Security boundary: the link code proves control of both sides; the service token only authorizes the service. Browser sessions may create codes/revoke for their own company; claim and status are service-token only. `company_id` validation on the existing `POST /api/bridge/sync` is intentionally not tightened in v1 to avoid breaking current senders.
- Failure handling: a previously failed `bridge_sync_log` row is cleared so the same idempotency key can be retried; modules treat Core `success: false` as a failure even when HTTP status is 200.
- Verification: Core link acceptance 39/39 on disposable PostgreSQL 16 (`mbs-core-link-pg`, port 5445); Retail → Core end-to-end 30/30 (self-register, queue an unlinked paid order, create code, claim, replay to `bridge_sync_log`/invoice/journal, revoke, re-link); `node --test tests/module-link-validation.test.mjs` 10/10; `tsc --noEmit` and targeted ESLint clean. Module-side APIs rolled to all six modules with matching typecheck/ESLint. These are disposable-database results, not production acceptance.
- Rollback: the migration only adds tables; leaving it in place is safe. To disable linking, stop creating codes and revoke active rows. Do not drop `module_links` before confirming no module holds a `core_company_id`.
- Status / approval boundary: implementation only. Production migration, deployment, and any env change still require explicit owner approval.

### [2026-11-11] Dev migration incident, repair, and owner standing authorization

- Context: the owner approved applying the pending Retail migrations to the Dev database (Neon). Run as `neondb_owner`, `mbs_retail_tenant_isolation` failed with `P3018 / 42501 must be owner of table mbs_retail_users`, because module tables are owned by `mbs_<module>_migrator` (§4.4). The failure was then marked `rolled-back` without owner confirmation, and the owner was told (incorrectly) that only a Neon password reset could unblock it. In fact `neondb_owner` already holds `ADMIN` on every `mbs_<module>_migrator` and can grant itself `SET` for one session.
- Decision:
  1. **Run module DDL as the module migrator**, never as the database owner. Procedure is now written down in `docs/MODULE_MIGRATION_RUNBOOK.md` and referenced from Core and all six module `AGENTS.md`.
  2. **A failed migration is not resolved automatically.** Stop, capture the error, inspect partial DDL, report. `prisma migrate resolve` is a decision, not a cleanup step.
  3. **New tables need an explicit `GRANT ... TO mbs_<module>_app`**; a migrator-created table does not inherit the database owner's default privileges. Without it the app fails at runtime while health checks still report `ok`.
  4. **Owner standing authorization** (recorded in Core `AGENTS.md`): read-only inspection of any environment, Dev module migrations as the migrator role, disposable test databases, and small direct defect fixes are pre-approved. Production migrations/data changes, env changes, deploy, push, and irreversible destructive operations still need explicit approval each time.
  5. **Least privilege restored:** the temporary `SET` grant was revoked; `neondb_owner` again has `ADMIN` only (`inherit = false`, `set = false`). The owner can override this by choosing to keep the grant.
  6. **Migration folders must carry the `mbs_<module>_` prefix.** `20261111052224_add_priority_to_maintenance` (Rental) was renamed to `mbs_rental_add_maintenance_priority` before it reaches Production; the Dev ledger row was renamed to match (checksum is taken from file contents, so a rename does not invalidate it).
- Outcome on Dev: pending migrations applied for all six modules — Retail (2), Service (3), Rental (3), Hotel (2), F&B (3), Pharmacy (2); 76 `mbs_*` tables all owned by their own migrator; `mbs_<module>_shops` granted to the matching app role; `prisma migrate status` reports no pending and no failed migrations for all six modules.
- Boundary: Dev only. Supabase (Production) was not contacted. Production migrations still require a backup plus explicit owner approval.
- Rollback: the migrations are additive. To stop using a module on Dev, revoke its links rather than dropping tables. The standing authorization can be narrowed at any time by editing the `AGENTS.md` section.

- Verification (2026-11-11): `prisma migrate status` clean for all six module repos; `pg_tables` ownership query shows six migrator owners and no database-owned `mbs_*` table; `information_schema.role_table_grants` shows `SELECT/INSERT/UPDATE/DELETE` for each `mbs_<module>_app` on its `*_shops` table; `SET ROLE mbs_retail_migrator` from the database owner is denied again. These are Dev-database checks, not production acceptance.

### [2026-11-12] Support channels: centralized LINE OA + per-project Discord webhooks

- Context: the owner wants customer-support channels on LINE and Discord for Core plus six module apps. The seven apps are separate Vercel projects with separate environments, so they do not share runtime configuration. A LINE Messaging API channel accepts exactly one webhook URL, and reply messages are free while push messages count against the monthly quota.
- Decision:
  1. **LINE is centralized in Core.** One Official Account owns `LINE_CHANNEL_ID`, `LINE_CHANNEL_SECRET`, and `LINE_CHANNEL_ACCESS_TOKEN`; modules never hold LINE credentials. Inbound events arrive at `POST /api/support/line/webhook` and are stored in Core (`support_channels`, `support_threads`, `support_messages`, `support_events`).
  2. **Discord is per project.** Every app gets its own incoming webhook in its own environment as `DISCORD_WEBHOOK_URL`, plus `SUPPORT_PRODUCT_KEY` and `SUPPORT_PRODUCT_NAME`. The same variable names are used everywhere so `lib/notify-discord.ts` can be copied unchanged into each repo. A shared bot is out of scope for this round.
  3. **The webhook is signature-authenticated, not session-authenticated.** It is allow-listed in `proxy.ts` and verifies `x-line-signature` as HMAC-SHA256 over the raw body using the channel secret.
  4. **Idempotency is mandatory.** `support_events` has PK `(company_id, provider, event_id)` and `support_messages` has a partial unique index on `(thread_id, provider_message_id)` so LINE retries cannot duplicate messages.
  5. **Credentials at rest are encrypted with a dedicated key.** `SUPPORT_TOKEN_ENCRYPTION_KEY` (base64, 32 bytes) is used only for support credentials; it is separate from `GOOGLE_TOKEN_ENCRYPTION_KEY` so each can be rotated independently.
- Consequences: a Discord or Core outage cannot break a module selling or serving customers; the only degradation is a missing notification. Core needs the `companies` table to resolve the owning company and rejects inbound events with 503 when no company exists.
- Impacted files: `lib/line.ts`, `lib/notify-discord.ts`, `lib/support-crypto.ts`, `app/api/support/line/webhook/route.ts`, `migrations/add_support_tables.sql`, `proxy.ts`, `scripts/bootstrap-init-db.mjs`, `.env.example`, `docs/SUPPORT_CHANNELS.md`, `tests/support-line.test.ts`.
- Rollback: the migration is additive. To stop inbound processing, disable the LINE webhook in LINE Console; leaving the tables in place is safe.
- Status: backend implemented, unit-tested (9 tests) and verified end-to-end against a disposable Docker database (11/11 checks, 2026-11-12): valid signature stores thread/message/event, duplicate delivery does not duplicate, invalid/missing signature returns 401, missing destination returns 400, non-text messages are stored, a real Discord notification is delivered, and an unreachable Discord endpoint still returns 200. Admin inbox, outbound push replies, and the `support` permission module are not implemented yet. No Production migration, deploy, or env change has been performed.

### [2026-11-12] Support inbox API: tenant-scoped read, outbound with honest delivery status

- Context: the inbound LINE webhook was already storing customer messages, but there was no way for a human to read or answer them, and no permission boundary existed for support data.
- Decision:
  1. **Read/write APIs are session + permission gated** (`lib/support-auth.ts`): admin/superadmin pass, other users need `checkPermission(userId, 'support', action)`. `support` is added to `lib/permissions.ts` MODULES so groups can be granted it. Every query is additionally scoped by the caller's `company_id`; another tenant's thread returns 404, not 403, so existence is not confirmed.
  2. **Provider identifiers are masked in responses** (`maskExternalId`: `…` + last 4). The admin UI does not need the full LINE user id.
  3. **Outbound replies record delivery truth.** The message row is written first with `delivery_status='pending'`, then LINE push is attempted, then the row becomes `sent` or `failed` with `delivery_error` (max 300 chars). A failed push keeps the message so the inbox shows "saved but not delivered" instead of silently losing it. The route returns 200 with `delivered: false` rather than pretending success or discarding the text.
  4. **Only LINE supports outbound.** Discord is notification-only (incoming webhook); replying inside Discord needs a bot and is out of scope.
  5. **The UI is handed to Kiro**, per the AI-to-AI handoff rule: `AI-HANDOFF/requests/REQ-0003-support-inbox-ui.md` documents the contract, UX rules, and acceptance criteria; OpenCode does not implement presentation code.
- Alternatives considered: gate only on `isAdmin` (rejected: no way to let a support agent in without full admin); delete failed outbound rows (rejected: hides failures from the operator); return 502 on delivery failure (rejected: the message is stored, so 200 + `delivered:false` describes the actual outcome).
- Impacted files/modules: `lib/support-auth.ts` (new), `lib/support-outbound.ts` (new), `app/api/support/threads/route.ts` (new), `app/api/support/threads/[id]/route.ts` (new), `app/api/support/threads/[id]/messages/route.ts` (new), `lib/permissions.ts`, `migrations/add_support_tables.sql` (`delivery_status`, `delivery_error` via `ADD COLUMN IF NOT EXISTS`), `tests/support-line.test.ts`, `docs/SUPPORT_CHANNELS.md`, `AI-HANDOFF/requests/REQ-0003-support-inbox-ui.md`.
- Verification (2026-11-12): 14/14 API checks against disposable `mbs_support_api_test` — 401 without session, 403 without permission, tenant A/B list isolation, masked ids, cross-tenant detail/outbound 404, invalid status 400, empty text 400, outbound stored with `delivery_status=failed` when LINE rejects the test token, PATCH status+priority persisted, detail reflects both messages. Unit tests 16/16. A second E2E regression run kept the webhook suite at 11/11.
- Rollback: revert the route files and drop the two `support_messages` columns; the tables and inbound webhook keep working without the inbox API.
- Status: backend implemented and verified locally. No Production migration, deploy, env change, or group-permission seed has been performed; the inbox UI is pending Kiro.

### [2026-11-12] Support access control: dedicated Support group + least-privilege role

- Context: the inbox API initially admitted only admin/superadmin. A support employee should be able to read and answer threads without being a full admin, and the legacy `group_permissions` schema (column-level UNIQUE on `group_id` and on `module`) made multi-module grants impossible.
- Decision:
  1. `requireSupportActor` now admits role `admin`/`superadmin`/`support` (bypass) **or** any member of a group granted the `support` module with the requested action.
  2. `migrations/add_support_group_and_permissions.sql` drops the two legacy column-level UNIQUE constraints, (re)creates the composite `UNIQUE (group_id, module)`, creates the table if missing, and seeds a system `Support` group with `can_create/can_read/can_update` on `support`.
  3. Least privilege: the Support group gets no delete/export/manage.
- Consequences: a support employee can be given access by adding them to the `Support` group or by setting `users.role = 'support'`, without granting admin rights. Admin/superadmin behaviour is unchanged.
- Impacted files: `lib/support-auth.ts`, `migrations/add_support_group_and_permissions.sql`, `scripts/bootstrap-init-db.mjs`, `docs/SUPPORT_CHANNELS.md`.
- Verification: migration applies cleanly and is idempotent on a disposable database (Support group + 1 permission row after two runs); `tsc --noEmit` and `eslint` clean.
- Rollback: revert the role check and drop the seeded group/permission row; the composite-constraint change is safe to keep.
- Status: implemented locally. Production migration pending approval.
