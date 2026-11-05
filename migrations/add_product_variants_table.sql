-- ============================================================
-- Migration: product_variants (สี/ไซส์/ประเภท)
-- Description: variants ของสินค้า สำหรับติดตามสต็อกแยกตามสี/ไซส์/ประเภท
-- parent = products; variant 継承 price/cost ได้ (override ได้)
-- MBSuite = core; inventory_variants เป็น plugin module
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS product_variants (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    branch_id INTEGER,
    sku_variant VARCHAR(100),
    barcode VARCHAR(100),
    variant_name VARCHAR(255),
    color VARCHAR(50),
    size VARCHAR(50),
    attr_type VARCHAR(50),
    price_override NUMERIC(15,2),
    cost_price_override NUMERIC(15,2),
    stock_quantity INTEGER DEFAULT 0,
    stock_qty INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_variants_company_id_fkey') THEN
    ALTER TABLE product_variants ADD CONSTRAINT product_variants_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_variants_product_id_fkey') THEN
    ALTER TABLE product_variants ADD CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_variants_branch_id_fkey') THEN
    ALTER TABLE product_variants ADD CONSTRAINT product_variants_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
  END IF;
END $$;

-- sku_variant unique per company (allow null)
CREATE UNIQUE INDEX IF NOT EXISTS ux_product_variants_sku_company
  ON product_variants (company_id, sku_variant) WHERE sku_variant IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_variants_company ON product_variants(company_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_branch ON product_variants(branch_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_barcode ON product_variants(company_id, barcode);

COMMIT;
