-- ============================================================
-- Migration: Customer & Subscription Console (กลุ่ม A)
-- - ขยาย companies: license_key / ข้อมูลติดต่อลูกค้า / ราคา / trial_end
-- - ตาราง subscription_events: ประวัติ ออก/ต่ออายุ/ระงับ/ปลดล็อก
--
-- วางเป็น idempotent: รันซ้ำได้ปลอดภัย
-- ============================================================

BEGIN;

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS license_key TEXT,
  ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS price_amount NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_currency VARCHAR(10) DEFAULT 'THB',
  ADD COLUMN IF NOT EXISTS trial_end TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_renewed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE TABLE IF NOT EXISTS subscription_events (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,              -- ISSUE / RENEW / SUSPEND / RESUME / REFUND / NOTE
  license_type VARCHAR(50),
  license_key TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  max_users INTEGER,
  amount NUMERIC(12,2),
  notes TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscription_events_company
  ON subscription_events(company_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_license_key
  ON companies(license_key) WHERE license_key IS NOT NULL;

COMMIT;