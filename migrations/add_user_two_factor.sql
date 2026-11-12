-- Add TOTP two-factor authentication support to users.
-- Additive and idempotent: safe to run on existing databases.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS totp_secret TEXT,
  ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS totp_verified_at TIMESTAMP WITH TIME ZONE;

CREATE TABLE IF NOT EXISTS user_recovery_codes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_recovery_codes_user_id
  ON user_recovery_codes (user_id);

CREATE INDEX IF NOT EXISTS idx_users_totp_enabled
  ON users (totp_enabled)
  WHERE totp_enabled = TRUE;
