BEGIN;

CREATE TABLE IF NOT EXISTS integration_webhook_events (
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    event_id VARCHAR(255) NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'processing',
    result JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (company_id, provider, event_id)
);

COMMIT;
