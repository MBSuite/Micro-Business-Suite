-- Add company_id column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS company_id INTEGER;
