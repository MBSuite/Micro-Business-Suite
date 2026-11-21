-- ============================================================
-- Migration: Bridge sync idempotency แยกตาม tenant
-- Description: แก้ key ที่เดิม UNIQUE ระดับตารางให้เป็น UNIQUE ต่อ (company_id, idempotency_key)
--              ป้องกันบริษัทหนึ่งได้รับผลลัพธ์ของอีกบริษัทเมื่อส่ง key ซ้ำกัน
-- ความเสี่ยง: ต้องรันบน disposable branch ก่อน และต้อง owner อนุมัติก่อนใช้กับ Production
-- ============================================================

BEGIN;

ALTER TABLE bridge_sync_log DROP CONSTRAINT IF EXISTS bridge_sync_log_idempotency_key_key;
DROP INDEX IF EXISTS bridge_sync_log_idempotency_key_key;

-- แถว legacy ที่ company_id IS NULL ไม่ถูกบังคับซ้ำ (NULL ต่างกันใน PostgreSQL)
-- ห้าม backfill company_id โดยเดา — ต้องตรวจ ownership ก่อนตามกฎ tenant mapping
CREATE UNIQUE INDEX IF NOT EXISTS uq_bridge_sync_log_tenant_idempotency
    ON bridge_sync_log (company_id, idempotency_key);

COMMIT;
