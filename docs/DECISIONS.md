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
