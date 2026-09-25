-- ============================================================
-- Migration: add tenant scope (company_id) to quotations & expenses
-- WS-3 #4 — ปิดช่อง cross-company IDOR ให้ครบทั้ง SALES (quotations)
-- และ PURCHASES (expenses) ตาม pattern เดิมของ invoices & payments
--
-- วางเป็น idempotent: รันซ้ำได้ปลอดภัย (ADD IF NOT EXISTS + guarded FK)
-- Backfill: มอบเอกสารเดิมทั้งหมดให้กับบริษัทของ admin/superadmin คนแรก
--
-- พิเศษ WS-3 #4: เพิ่ม UNIQUE constraint บน users.email แบบ guarded
-- เพื่อปิดช่อง race-condition ตอน register (prod มี users_email_key แล้ว
-- บล็อกนี้จะข้ามทันที นับเป็น defensive สำหรับ env ที่เก่ากว่า)
-- ============================================================

BEGIN;

ALTER TABLE quotations ADD COLUMN IF NOT EXISTS company_id INTEGER;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS company_id INTEGER;

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
    UPDATE quotations SET company_id = backfill_company WHERE company_id IS NULL;
    UPDATE expenses SET company_id = backfill_company WHERE company_id IS NULL;
  END IF;
END $$;

-- Foreign keys (guarded — no IF NOT EXISTS for constraints in PG)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quotations_company_id_fkey') THEN
    ALTER TABLE quotations
      ADD CONSTRAINT quotations_company_id_fkey
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'expenses_company_id_fkey') THEN
    ALTER TABLE expenses
      ADD CONSTRAINT expenses_company_id_fkey
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_quotations_company ON quotations(company_id);
CREATE INDEX IF NOT EXISTS idx_expenses_company ON expenses(company_id);

-- users.email UNIQUE (guarded) — prod มี users_email_key แล้ว จะข้าม
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_key') THEN
    ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
  END IF;
END $$;

COMMIT;