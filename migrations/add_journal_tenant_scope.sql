-- ============================================================
-- Migration: tenant scope for journal_entries
-- Description: เพิ่ม company_id ให้สมุดรายวัน และ backfill จาก invoice ที่อ้างอิง
-- ============================================================

BEGIN;

ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;

-- Backfill from invoices (where reference_type='invoice' and reference_id matches)
UPDATE journal_entries je
SET company_id = i.company_id
FROM invoices i
WHERE je.reference_type = 'invoice'
  AND je.reference_id = i.id
  AND je.company_id IS NULL;

UPDATE journal_entries je
SET company_id = e.company_id
FROM expenses e
WHERE je.reference_type = 'expense'
  AND je.reference_id = e.id
  AND je.company_id IS NULL
  AND e.company_id IS NOT NULL;

UPDATE journal_entries je
SET company_id = p.company_id
FROM payments p
WHERE je.reference_type IN ('receipt', 'payment')
  AND je.reference_id = p.id
  AND je.company_id IS NULL
  AND p.company_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_journal_entries_company ON journal_entries(company_id);

COMMIT;
