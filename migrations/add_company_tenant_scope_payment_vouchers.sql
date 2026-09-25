-- ============================================================
-- Migration: add tenant scope (company_id) to payment_vouchers
-- WS-3 #5 — ปิดช่อง cross-company IDOR ให้ครบในฝั่ง PURCHASES/Payment
-- หลังจาก quotations & expenses (add_company_tenant_scope_quotations_expenses.sql)
--
-- วางเป็น idempotent: รันซ้ำได้ปลอดภัย (ADD IF NOT EXISTS + guarded FK)
-- Backfill: มอบเอกสารเดิมทั้งหมดให้กับบริษัทของ admin/superadmin คนแรก
-- ============================================================

BEGIN;

ALTER TABLE payment_vouchers ADD COLUMN IF NOT EXISTS company_id INTEGER;

-- Backfill rows that predate multi-company to the first admin company
DO $$
DECLARE
  backfill_company INTEGER;
BEGIN
  SELECT company_id INTO backfill_company
  FROM users
  WHERE role IN ('admin', 'superadmin')
    AND company_id IS NOT NULL
  ORDER BY id ASC
  LIMIT 1;

  IF backfill_company IS NOT NULL THEN
    UPDATE payment_vouchers SET company_id = backfill_company WHERE company_id IS NULL;
  END IF;
END $$;

-- Foreign key (guarded — no IF NOT EXISTS for constraints in PG)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payment_vouchers_company_id_fkey') THEN
    ALTER TABLE payment_vouchers
      ADD CONSTRAINT payment_vouchers_company_id_fkey
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payment_vouchers_company ON payment_vouchers(company_id);

COMMIT;