-- ============================================================
-- Migration: branch_stock (สต็อกแยกสาขา)
-- Description: ยอดคงเหลือสินค้า/variant ต่อสาขา
-- MBSuite = core; multi_branch เป็น plugin module
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS branch_stock (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    branch_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    variant_id INTEGER,
    stock_quantity INTEGER DEFAULT 0,
    stock_qty INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 5,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (branch_id, product_id, variant_id)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'branch_stock_company_id_fkey') THEN
    ALTER TABLE branch_stock ADD CONSTRAINT branch_stock_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'branch_stock_branch_id_fkey') THEN
    ALTER TABLE branch_stock ADD CONSTRAINT branch_stock_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'branch_stock_product_id_fkey') THEN
    ALTER TABLE branch_stock ADD CONSTRAINT branch_stock_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'branch_stock_variant_id_fkey') THEN
    ALTER TABLE branch_stock ADD CONSTRAINT branch_stock_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_branch_stock_branch ON branch_stock(branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_stock_product ON branch_stock(product_id);
CREATE INDEX IF NOT EXISTS idx_branch_stock_company ON branch_stock(company_id);

COMMIT;
