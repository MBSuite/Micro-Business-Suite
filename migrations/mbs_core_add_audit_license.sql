-- ============================================================
-- Migration: mbs_core_add_audit_license
-- Purpose : เพิ่ม license ประเภท AUDIT (สำหรับ audit-test user)
--           และ flag is_audit บนตาราง companies เพื่อแยกออกจากลูกค้าจริง
--
-- เป้าหมาย: ตาราง companies ของ Core ใน shared PostgreSQL
-- หลักการ : idempotent (รันซ้ำปลอดภัย), one transaction (BEGIN/COMMIT)
--           ตาม docs/MODULE_MIGRATION_RUNBOOK.md §0 และ §7
--
-- หมายเหตุ:
--   - plan_type / subscription_status ไม่มี CHECK constraint ใน schema ปัจจุบัน
--     (ตรวจจาก scripts/backup.sql) จึงไม่ต้อง ALTER constraint เพื่อเพิ่ม 'AUDIT'
--   - ประวัติการออก AUDIT บันทึกใน subscription_events ด้วย
--     license_type = 'AUDIT' และ payload = '{"is_audit": true, ...}'::jsonb
--     (ไม่เพิ่มคอลัมน์ใหม่ในตาราง events)
--   - ต้องรันด้วย role ที่เป็นเจ้าของตาราง (SET LOCAL ROLE mbs_<module>_migrator)
--     Production ต้องมี backup + อนุมัติจากพี่ฆังก่อนเสมอ
--   - ห้ามรัน prisma migrate resolve เองถ้า migration fail — หยุดแล้วรายงาน
-- ============================================================

BEGIN;

-- 1) Flag บน companies -------------------------------
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS is_audit BOOLEAN NOT NULL DEFAULT FALSE;

-- 2) index เฉพาะแถวที่เป็น audit (เล็ก + ใช้กรองใน admin list)
CREATE INDEX IF NOT EXISTS idx_companies_is_audit
  ON companies (is_audit)
  WHERE is_audit = TRUE;

-- 3) เอกสารกำกับคอลัมน์ (Anti-Drift: ค่าที่อนุญาตตรงกับ LicenseType ใน lib/license.ts)
COMMENT ON COLUMN companies.plan_type IS
  'License tier: FREE | TRIAL | STANDARD | PROFESSIONAL | ENTERPRISE | AUDIT';

COMMENT ON COLUMN companies.is_audit IS
  'TRUE เฉพาะบริษัทที่ถือ license AUDIT สำหรับทดสอบตรวจสอบระบบ — กันการนับรวมกับลูกค้าจริง';

COMMIT;

-- ============================================================
-- Post-migration verification (รันแยกหลัง COMMIT สำเร็จ)
-- ------------------------------------------------------------
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'companies' AND column_name IN ('plan_type','is_audit');
--
-- SELECT id, name, plan_type, is_audit, subscription_status
-- FROM companies WHERE is_audit = TRUE;
--
-- SELECT migration_name, finished_at IS NOT NULL AS applied
-- FROM _prisma_migrations WHERE migration_name LIKE 'mbs_core%'
-- ORDER BY started_at;
-- ============================================================
