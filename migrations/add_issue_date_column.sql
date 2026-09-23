-- Add issue_date column to quotations table
-- Migration: 2026-04-29-add-issue-date-column.sql
-- Updated for Era 2 schema: quotations.created_at is TIMESTAMP (not text).

-- Add issue_date column as DATE type
ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS issue_date DATE;

-- Backfill issue_date from created_at (works with TIMESTAMP or ISO text)
UPDATE quotations 
SET issue_date = created_at::date
WHERE created_at IS NOT NULL AND created_at::text <> '';

-- Add comments for documentation
COMMENT ON COLUMN quotations.issue_date IS 'Date when quotation was issued to customer (format: YYYY-MM-DD)';
