-- ============================================================
-- Migration: F&B (ร้านอาหาร/คาเฟ่)
-- Description: ผังโต๊ะ, ออเดอร์, KOT, บิล
-- MBSuite = core; f_and_b เป็น plugin module
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS fb_tables (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(50) NOT NULL,
    seats INTEGER DEFAULT 2,
    zone VARCHAR(50),
    status VARCHAR(20) DEFAULT 'free', -- free/occupied/reserved
    current_order_id INTEGER,
    pos_x INTEGER DEFAULT 0,
    pos_y INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (company_id, code)
);

CREATE TABLE IF NOT EXISTS fb_orders (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    table_id INTEGER,
    order_number VARCHAR(30) NOT NULL,
    status VARCHAR(20) DEFAULT 'open', -- open/kot_sent/billed/paid/cancelled
    subtotal NUMERIC(15,2) DEFAULT 0,
    discount NUMERIC(15,2) DEFAULT 0,
    vat NUMERIC(15,2) DEFAULT 0,
    total NUMERIC(15,2) DEFAULT 0,
    notes TEXT,
    invoice_id INTEGER,
    created_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS fb_order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    product_id INTEGER,
    description VARCHAR(255) NOT NULL,
    qty NUMERIC(10,2) DEFAULT 1,
    price NUMERIC(15,2) DEFAULT 0,
    total NUMERIC(15,2) DEFAULT 0,
    notes TEXT,
    kot_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fb_kots (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    kot_number VARCHAR(30) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending/preparing/ready/served
    items_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fb_tables_company_id_fkey') THEN
    ALTER TABLE fb_tables ADD CONSTRAINT fb_tables_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fb_orders_company_id_fkey') THEN
    ALTER TABLE fb_orders ADD CONSTRAINT fb_orders_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fb_orders_table_id_fkey') THEN
    ALTER TABLE fb_orders ADD CONSTRAINT fb_orders_table_id_fkey FOREIGN KEY (table_id) REFERENCES fb_tables(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fb_orders_invoice_id_fkey') THEN
    ALTER TABLE fb_orders ADD CONSTRAINT fb_orders_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fb_orders_created_by_fkey') THEN
    ALTER TABLE fb_orders ADD CONSTRAINT fb_orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fb_order_items_order_id_fkey') THEN
    ALTER TABLE fb_order_items ADD CONSTRAINT fb_order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES fb_orders(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fb_order_items_product_id_fkey') THEN
    ALTER TABLE fb_order_items ADD CONSTRAINT fb_order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fb_kots_company_id_fkey') THEN
    ALTER TABLE fb_kots ADD CONSTRAINT fb_kots_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fb_kots_order_id_fkey') THEN
    ALTER TABLE fb_kots ADD CONSTRAINT fb_kots_order_id_fkey FOREIGN KEY (order_id) REFERENCES fb_orders(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_fb_tables_company ON fb_tables(company_id);
CREATE INDEX IF NOT EXISTS idx_fb_orders_company ON fb_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_fb_orders_table ON fb_orders(table_id);
CREATE INDEX IF NOT EXISTS idx_fb_order_items_order ON fb_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_fb_kots_order ON fb_kots(order_id);

COMMIT;
