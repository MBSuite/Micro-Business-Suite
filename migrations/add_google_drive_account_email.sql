ALTER TABLE company_settings
  ADD COLUMN IF NOT EXISTS google_drive_account_email VARCHAR(320);
