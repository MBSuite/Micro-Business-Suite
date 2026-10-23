-- Payments / invoices columns previously altered at runtime by app/actions/vouchers.ts
-- Idempotent — safe on existing databases.

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS invoice_id INTEGER,
  ADD COLUMN IF NOT EXISTS amount DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS payment_date DATE,
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100),
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS vat_amount DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS is_service BOOLEAN DEFAULT FALSE;
