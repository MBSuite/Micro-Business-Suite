-- Backfill users.company_id for rows that are still NULL.
--
-- SAFETY: This migration intentionally does NOT assign a default company to
-- unmapped users. Automatic fallback to the first company was removed because
-- it can silently attach a user to the wrong tenant. Unmapped users must be
-- reviewed and assigned an explicit company_id by the owner before rollout.
--
-- Operators can list unmapped users with:
--   node scripts/audit-company-mappings.mjs
-- and apply an approved mapping with an explicit UPDATE, for example:
--   UPDATE users SET company_id = <approved_company_id> WHERE id = <user_id>;

DO $$
DECLARE
  unmapped_count integer;
BEGIN
  SELECT COUNT(*)::integer INTO unmapped_count
  FROM users
  WHERE company_id IS NULL;

  RAISE NOTICE 'Unmapped users requiring owner-approved company assignment: %', unmapped_count;
END $$;
