-- ============================================================
-- Migration: Bridge sync idempotency log
-- Description: เก็บ idempotency_key ของ finance events ที่ sync มาจาก Suites
--              เพื่อป้องกัน duplicate journal/invoice
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS bridge_sync_log (
    id SERIAL PRIMARY KEY,
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,
    event VARCHAR(100) NOT NULL,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'success', -- success | failed | pending
    result JSONB,
    error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bridge_sync_log_company ON bridge_sync_log(company_id);
CREATE INDEX IF NOT EXISTS idx_bridge_sync_log_event ON bridge_sync_log(event);
CREATE INDEX IF NOT EXISTS idx_bridge_sync_log_created ON bridge_sync_log(created_at);

COMMIT;
