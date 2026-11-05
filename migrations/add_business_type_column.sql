-- ============================================================
-- Migration: business_type on companies
-- Description: ประเภทธุรกิจของบริษัท (retail/fnb/pharmacy/service/general)
--              ใช้ auto-install plugin pack ตอนสมัคร
-- ============================================================

BEGIN;

ALTER TABLE companies ADD COLUMN IF NOT EXISTS business_type VARCHAR(30) DEFAULT 'general';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_business_type_check') THEN
    ALTER TABLE companies ADD CONSTRAINT companies_business_type_check
      CHECK (business_type IN ('general','retail','fnb','pharmacy','service'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_companies_business_type ON companies(business_type);

COMMIT;
