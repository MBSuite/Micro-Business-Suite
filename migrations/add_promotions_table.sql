-- ============================================================
-- Migration: promotions (โปรโมชัน/ส่วนลด/คูปอง)
-- Description: โปรโมชันที่ใช้ที่ POS/Invoice — percentage/fixed/bogo/bundle
-- MBSuite = core; promotions เป็น plugin module
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS promotions (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    promo_type VARCHAR(20) NOT NULL DEFAULT 'percentage', -- percentage/fixed/bogo/bundle
    value NUMERIC(15,2) DEFAULT 0,
    min_purchase NUMERIC(15,2) DEFAULT 0,
    max_discount NUMERIC(15,2),
    applies_to VARCHAR(20) DEFAULT 'all', -- all/products/categories
    applies_ids TEXT, -- comma-separated product/category ids (when applies_to != all)
    starts_at TIMESTAMP WITH TIME ZONE,
    ends_at TIMESTAMP WITH TIME ZONE,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'promotions_company_id_fkey') THEN
    ALTER TABLE promotions ADD CONSTRAINT promotions_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'promotions_created_by_fkey') THEN
    ALTER TABLE promotions ADD CONSTRAINT promotions_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- code unique per company (allow null for auto-applied promos)
CREATE UNIQUE INDEX IF NOT EXISTS ux_promotions_code_company
  ON promotions (company_id, code) WHERE code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_promotions_company ON promotions(company_id);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(starts_at, ends_at);

COMMIT;
