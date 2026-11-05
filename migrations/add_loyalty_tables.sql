-- ============================================================
-- Migration: loyalty (CRM สะสมคะแนน/สมาชิก)
-- Description: บัญชีสะสมคะแนนของลูกค้า + ledger ธุรกรรม (earn/redeem/expire/adjust)
-- MBSuite = core; crm_loyalty เป็น plugin module
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS loyalty_accounts (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    contact_id INTEGER NOT NULL,
    tier VARCHAR(20) DEFAULT 'bronze', -- bronze/silver/gold/platinum
    points_balance INTEGER DEFAULT 0,
    lifetime_points INTEGER DEFAULT 0,
    total_spent NUMERIC(15,2) DEFAULT 0,
    member_since TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active', -- active/suspended/closed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (company_id, contact_id)
);

CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    account_id INTEGER NOT NULL,
    tx_type VARCHAR(20) NOT NULL, -- earn/redeem/expire/adjust
    points INTEGER NOT NULL,
    balance_after INTEGER,
    reference_type VARCHAR(30), -- invoice/payment/manual
    reference_id INTEGER,
    description TEXT,
    created_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'loyalty_accounts_company_id_fkey') THEN
    ALTER TABLE loyalty_accounts ADD CONSTRAINT loyalty_accounts_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'loyalty_accounts_contact_id_fkey') THEN
    ALTER TABLE loyalty_accounts ADD CONSTRAINT loyalty_accounts_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'loyalty_transactions_company_id_fkey') THEN
    ALTER TABLE loyalty_transactions ADD CONSTRAINT loyalty_transactions_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'loyalty_transactions_account_id_fkey') THEN
    ALTER TABLE loyalty_transactions ADD CONSTRAINT loyalty_transactions_account_id_fkey FOREIGN KEY (account_id) REFERENCES loyalty_accounts(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'loyalty_transactions_created_by_fkey') THEN
    ALTER TABLE loyalty_transactions ADD CONSTRAINT loyalty_transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_company ON loyalty_accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_contact ON loyalty_accounts(contact_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_account ON loyalty_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_company ON loyalty_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_ref ON loyalty_transactions(reference_type, reference_id);

COMMIT;
