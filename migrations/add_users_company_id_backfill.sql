-- Backfill users.company_id for rows that are still NULL.
-- MANUAL/BOOTSTRAP: review mapping before running in production.
-- This migration is idempotent and only updates NULL rows.

DO $$
DECLARE
  default_company_id integer;
BEGIN
  SELECT id INTO default_company_id FROM companies ORDER BY id ASC LIMIT 1;
  IF default_company_id IS NULL THEN
    RAISE NOTICE 'No companies found; skipping user company_id backfill.';
    RETURN;
  END IF;
  UPDATE users SET company_id = default_company_id WHERE company_id IS NULL;
END $$;
