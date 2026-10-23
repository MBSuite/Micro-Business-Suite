-- Add contact_type column to contacts table
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS contact_type VARCHAR(20);

-- Backfill existing rows (idempotent; only touches rows without a value)
UPDATE contacts
SET contact_type = CASE
  WHEN LOWER(COALESCE(type, '')) IN ('vendor', 'supplier') THEN 'SUPPLIER'
  WHEN LOWER(COALESCE(type, '')) = 'both' THEN 'BOTH'
  WHEN LOWER(COALESCE(type, '')) = 'customer' THEN 'CUSTOMER'
  ELSE 'CUSTOMER'
END
WHERE contact_type IS NULL OR contact_type = '';
