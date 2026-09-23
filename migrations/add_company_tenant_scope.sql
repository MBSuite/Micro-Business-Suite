-- ============================================================
-- Migration: add tenant scope (company_id) to invoices & payments
-- WS-3 / เฟส 2 — ปิดช่อง cross-company IDOR (จับคู่กับ harness ของธาร)
--
-- วางเป็น idempotent: รันซ้ำได้ปลอดภัย (ADD IF NOT EXISTS + guarded FK)
-- Backfill: มอบเอกสารเดิมทั้งหมดให้กับบริษัทของ admin/superadmin คนแรก
-- ============================================================

BEGIN;

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS company_id INTEGER;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS company_id INTEGER;

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
    UPDATE invoices SET company_id = backfill_company WHERE company_id IS NULL;
    UPDATE payments SET company_id = backfill_company WHERE company_id IS NULL;
  END IF;
END $$;

-- Foreign keys (guarded — no IF NOT EXISTS for constraints in PG)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_company_id_fkey') THEN
    ALTER TABLE invoices
      ADD CONSTRAINT invoices_company_id_fkey
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_company_id_fkey') THEN
    ALTER TABLE payments
      ADD CONSTRAINT payments_company_id_fkey
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_invoices_company ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_payments_company ON payments(company_id);

COMMIT;