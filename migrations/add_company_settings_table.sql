-- Create company_settings table
-- NOTE: canonical column is `name` (matches app/actions/settings.ts and the
-- live Neon schema). `lib/settings.ts` maps `name` <-> `company_name` for
-- backward compatibility with consumers.
CREATE TABLE IF NOT EXISTS company_settings (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL DEFAULT 'Micro-Business-Suite',
  tax_id VARCHAR(50),
  address TEXT,
  logo_url TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  bank_name VARCHAR(255),
  bank_account_name VARCHAR(255),
  bank_account_number VARCHAR(50),
  bank_branch VARCHAR(255),
  vat_rate NUMERIC(5,2) DEFAULT 7.00,
  withholding_tax_rate NUMERIC(5,2) DEFAULT 3.00,
  is_vat_registered BOOLEAN DEFAULT TRUE,
  currency VARCHAR(10) DEFAULT 'THB',
  invoice_prefix VARCHAR(20) DEFAULT 'INV',
  quotation_prefix VARCHAR(20) DEFAULT 'QT',
  google_client_id VARCHAR(255),
  google_client_secret VARCHAR(255),
  google_refresh_token TEXT,
  google_redirect_uri VARCHAR(255) DEFAULT 'https://developers.google.com/oauthplayground',
  google_drive_enabled BOOLEAN DEFAULT FALSE
);

-- Ensure missing columns exist on pre-existing tables (idempotent)
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255);
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS bank_account_name VARCHAR(255);
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(50);
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS bank_branch VARCHAR(255);
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS vat_rate NUMERIC(5,2) DEFAULT 7.00;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS withholding_tax_rate NUMERIC(5,2) DEFAULT 3.00;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS is_vat_registered BOOLEAN DEFAULT TRUE;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'THB';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS invoice_prefix VARCHAR(20) DEFAULT 'INV';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS quotation_prefix VARCHAR(20) DEFAULT 'QT';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS google_client_id VARCHAR(255);
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS google_client_secret VARCHAR(255);
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS google_redirect_uri VARCHAR(255) DEFAULT 'https://developers.google.com/oauthplayground';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS google_drive_enabled BOOLEAN DEFAULT FALSE;

-- Seed the default row once (idempotent)
INSERT INTO company_settings (name, tax_id, address)
SELECT 'Micro-Business-Suite', '', 'Company Address, Thailand'
WHERE NOT EXISTS (SELECT 1 FROM company_settings);
