BEGIN;

ALTER TABLE company_settings
  ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS receipt_prefix VARCHAR(20) DEFAULT 'REC';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS journal_prefix VARCHAR(20) DEFAULT 'GJ';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS invoice_footer TEXT;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS quotation_footer TEXT;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS receipt_footer TEXT;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS rd_client_id VARCHAR(255);
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS rd_client_secret VARCHAR(255);
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS rd_api_key VARCHAR(255);
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS rd_base_url VARCHAR(255) DEFAULT 'https://api-portal.rd.go.th';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS rd_enabled BOOLEAN DEFAULT FALSE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'company_settings_company_id_fkey'
  ) THEN
    ALTER TABLE company_settings
      ADD CONSTRAINT company_settings_company_id_fkey
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS company_settings_company_id_key
  ON company_settings(company_id)
  WHERE company_id IS NOT NULL;

-- A legacy singleton can be assigned automatically only when ownership is unambiguous.
DO $$
DECLARE
  company_count INTEGER;
  only_company_id INTEGER;
BEGIN
  SELECT COUNT(*)::int, MIN(id) INTO company_count, only_company_id
  FROM companies;

  IF company_count = 1 THEN
    UPDATE company_settings
    SET company_id = only_company_id
    WHERE company_id IS NULL
      AND id = (SELECT id FROM company_settings ORDER BY id ASC LIMIT 1);
  END IF;
END $$;

-- Keep unassigned legacy settings intact; initialize isolated, non-secret defaults per tenant.
INSERT INTO company_settings (company_id, name)
SELECT c.id, c.name
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM company_settings cs WHERE cs.company_id = c.id
);

COMMIT;
