-- ============================================================
-- Migration: tenant scope (company_id) for master tables
-- contacts, products, product_categories, services, reminders
--
-- หมายเหตุ: chart_of_accounts เป็น master ที่ใช้ร่วมทุกบริษัท (account_code
-- unique ระดับ global, journal_entries อ้างอิงข้าม) -> ไม่ tenant scope
-- ============================================================

BEGIN;

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS company_id INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS company_id INTEGER;
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS company_id INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS company_id INTEGER;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS company_id INTEGER;

-- Backfill rows ที่เกิดก่อน multi-company ให้กับบริษัทของ admin/superadmin คนแรก
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
    UPDATE contacts SET company_id = backfill_company WHERE company_id IS NULL;
    UPDATE products SET company_id = backfill_company WHERE company_id IS NULL;
    UPDATE product_categories SET company_id = backfill_company WHERE company_id IS NULL;
    UPDATE services SET company_id = backfill_company WHERE company_id IS NULL;
    UPDATE reminders SET company_id = backfill_company WHERE company_id IS NULL;
  END IF;
END $$;

-- Foreign keys (guarded — PG ไม่มี IF NOT EXISTS สำหรับ constraint)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contacts_company_id_fkey') THEN
    ALTER TABLE contacts ADD CONSTRAINT contacts_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_company_id_fkey') THEN
    ALTER TABLE products ADD CONSTRAINT products_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_categories_company_id_fkey') THEN
    ALTER TABLE product_categories ADD CONSTRAINT product_categories_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'services_company_id_fkey') THEN
    ALTER TABLE services ADD CONSTRAINT services_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reminders_company_id_fkey') THEN
    ALTER TABLE reminders ADD CONSTRAINT reminders_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_products_company ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_company ON product_categories(company_id);
CREATE INDEX IF NOT EXISTS idx_services_company ON services(company_id);
CREATE INDEX IF NOT EXISTS idx_reminders_company ON reminders(company_id);

COMMIT;