BEGIN;

CREATE TABLE IF NOT EXISTS app_migrations (
  migration_name TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
DECLARE
  affected_rows INTEGER;
BEGIN
  INSERT INTO app_migrations (migration_name)
  VALUES ('clear_legacy_google_oauth_credentials')
  ON CONFLICT (migration_name) DO NOTHING;

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  IF affected_rows > 0 THEN
    UPDATE company_settings
    SET google_client_id = NULL,
        google_client_secret = NULL,
        google_refresh_token = NULL,
        google_redirect_uri = NULL,
        google_drive_account_email = NULL,
        google_drive_enabled = FALSE;
  END IF;
END $$;

COMMIT;
