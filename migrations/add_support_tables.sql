-- ============================================================
-- Migration: support channels (LINE / Discord) for Core
-- Description: เก็บช่องทางซัพพอร์ต, เธรด, ข้อความ และ event idempotency
-- Scope: Core only. Module apps do not read these tables directly.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS support_channels (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    provider VARCHAR(20) NOT NULL,          -- line | discord | inapp
    external_id VARCHAR(255) NOT NULL,      -- LINE destination (bot user id) / Discord channel id
    name VARCHAR(255),
    credentials_enc TEXT,                   -- AES-256-GCM payload (enc:v1:...) — never plaintext
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active | disabled
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT support_channels_company_provider_external_key
        UNIQUE (company_id, provider, external_id)
);

CREATE TABLE IF NOT EXISTS support_threads (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    channel_id INTEGER NOT NULL,
    external_thread_id VARCHAR(255) NOT NULL, -- provider-side conversation id (LINE user id)
    contact_id INTEGER,
    subject VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'open',    -- open | pending | closed
    priority VARCHAR(20) NOT NULL DEFAULT 'normal', -- low | normal | high | urgent
    assignee_user_id INTEGER,
    last_message_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT support_threads_channel_external_key
        UNIQUE (company_id, channel_id, external_thread_id)
);

CREATE TABLE IF NOT EXISTS support_messages (
    id BIGSERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    thread_id INTEGER NOT NULL,
    direction VARCHAR(10) NOT NULL,          -- in | out
    provider_message_id VARCHAR(255),
    author_external_id VARCHAR(255),
    author_user_id INTEGER,
    body TEXT,
    attachments JSONB,
    delivery_status VARCHAR(20),                     -- inbound: NULL; outbound: pending | sent | failed
    delivery_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT support_messages_direction_check CHECK (direction IN ('in', 'out'))
);

-- Outbound delivery bookkeeping was added after the first draft of this table.
-- ADD COLUMN IF NOT EXISTS keeps the migration idempotent for environments that
-- already ran the earlier version.
ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(20);
ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS delivery_error TEXT;

CREATE TABLE IF NOT EXISTS support_events (
    company_id INTEGER NOT NULL,
    provider VARCHAR(20) NOT NULL,
    event_id VARCHAR(255) NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'processing', -- processing | completed | failed
    result JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (company_id, provider, event_id)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'support_channels_company_id_fkey') THEN
    ALTER TABLE support_channels ADD CONSTRAINT support_channels_company_id_fkey
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'support_threads_company_id_fkey') THEN
    ALTER TABLE support_threads ADD CONSTRAINT support_threads_company_id_fkey
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'support_threads_channel_id_fkey') THEN
    ALTER TABLE support_threads ADD CONSTRAINT support_threads_channel_id_fkey
      FOREIGN KEY (channel_id) REFERENCES support_channels(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'support_messages_thread_id_fkey') THEN
    ALTER TABLE support_messages ADD CONSTRAINT support_messages_thread_id_fkey
      FOREIGN KEY (thread_id) REFERENCES support_threads(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_support_threads_company_status
  ON support_threads (company_id, status, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_messages_thread
  ON support_messages (thread_id, created_at);

CREATE UNIQUE INDEX IF NOT EXISTS uq_support_messages_provider_message
  ON support_messages (thread_id, provider_message_id)
  WHERE provider_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_support_events_created
  ON support_events (created_at DESC);

COMMIT;
