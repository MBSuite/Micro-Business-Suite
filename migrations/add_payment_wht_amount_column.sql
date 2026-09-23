-- Add wht_amount to payments (was previously only applied at runtime by app/* actions).
-- Idempotent — safe to run on an existing production database.
ALTER TABLE payments ADD COLUMN IF NOT EXISTS wht_amount DECIMAL(15,2) DEFAULT 0;