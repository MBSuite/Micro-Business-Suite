-- ============================================================
-- Migration: integration_connections (E-commerce/Delivery connectors)
-- Description: เก็บการเชื่อมต่อ Shopee/Lazada/GrabFood/LINE MAN/Foodpanda
-- MBSuite = core; ecommerce_integration/delivery_integration เป็น plugin module
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS integration_connections (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    provider VARCHAR(50) NOT NULL, -- shopee/lazada/grabfood/lineman/foodpanda/webstore
    category VARCHAR(20) NOT NULL, -- ecommerce/delivery
    name VARCHAR(255),
    credentials JSONB,
    settings JSONB,
    status VARCHAR(20) DEFAULT 'disconnected', -- connected/disconnected/error
    last_sync_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'integration_connections_company_id_fkey') THEN
    ALTER TABLE integration_connections ADD CONSTRAINT integration_connections_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_intconn_company ON integration_connections(company_id);
CREATE INDEX IF NOT EXISTS idx_intconn_provider ON integration_connections(provider);

COMMIT;
