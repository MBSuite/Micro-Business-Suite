-- Recurring billing schema previously created/altered at runtime by
-- app/recurring/page.tsx and app/api/recurring/generate/route.ts
-- Idempotent — safe to re-run.

ALTER TABLE recurring_invoices
  ADD COLUMN IF NOT EXISTS billing_day INTEGER,
  ADD COLUMN IF NOT EXISTS due_day INTEGER DEFAULT 17,
  ADD COLUMN IF NOT EXISTS wht_rate DECIMAL(5, 2) DEFAULT 3.00,
  ADD COLUMN IF NOT EXISTS last_billed_at TIMESTAMP NULL;

-- Backfill billing_day from existing dates (only rows without a value)
UPDATE recurring_invoices
SET billing_day = EXTRACT(
  DAY FROM COALESCE(
    NULLIF(next_billing_date, '')::date,
    NULLIF(start_date, '')::date,
    CURRENT_DATE
  )
)::int
WHERE billing_day IS NULL;

CREATE TABLE IF NOT EXISTS subscription_invoices (
  id SERIAL PRIMARY KEY,
  subscription_id INTEGER NOT NULL REFERENCES recurring_invoices(id) ON DELETE CASCADE,
  invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL,
  billing_period DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_subscription_billing_period
  ON subscription_invoices (subscription_id, billing_period);
