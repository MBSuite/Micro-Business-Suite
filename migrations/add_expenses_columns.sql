-- Expenses table baseline + modern columns (idempotent)
-- Moves the schema previously created/altered at runtime by app/expense-actions.ts
-- into the controlled bootstrap migration set.
-- Safe on both fresh databases and legacy snapshots (IF NOT EXISTS everywhere).

CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'อื่นๆ',
  amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  expense_date DATE NOT NULL,
  reference_no VARCHAR(100),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'paid',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS reference_no VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tax_invoice_no VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tax_invoice_date DATE,
  ADD COLUMN IF NOT EXISTS vat_amount DECIMAL(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contact_id INTEGER,
  ADD COLUMN IF NOT EXISTS classification VARCHAR(20) NOT NULL DEFAULT 'OPEX',
  ADD COLUMN IF NOT EXISTS receipt_url TEXT,
  ADD COLUMN IF NOT EXISTS receipt_file_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS receipt_mime_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS wht_rate DECIMAL(5, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wht_amount DECIMAL(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_amount DECIMAL(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_service BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS original_currency VARCHAR(10) DEFAULT 'THB',
  ADD COLUMN IF NOT EXISTS original_amount DECIMAL(15, 4) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(15, 6) DEFAULT NULL;
