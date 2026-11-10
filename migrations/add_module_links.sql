-- ============================================================
-- Migration: Optional Core linking
-- Description:
--   * bridge_link_codes = one-time codes issued by a Core admin
--   * module_links      = active/revoked mapping between a module shop
--                         and a Core company
--
-- Rules (ADR-0006):
--   * a link code is bound to one module + one Core company, expires in
--     15 minutes, and can be used once
--   * one shop per module maps to at most one active Core company
--   * one Core company maps to at most one active shop per module
--     (the same company may still link to several different modules)
--   * revocation keeps history instead of deleting rows
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS bridge_link_codes (
    id SERIAL PRIMARY KEY,
    code_hash VARCHAR(64) NOT NULL UNIQUE,          -- sha256 hex; plaintext is never stored
    module VARCHAR(20) NOT NULL,
    core_company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    created_by INTEGER,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bridge_link_codes_company ON bridge_link_codes(core_company_id);
CREATE INDEX IF NOT EXISTS idx_bridge_link_codes_expires ON bridge_link_codes(expires_at);

CREATE TABLE IF NOT EXISTS module_links (
    id SERIAL PRIMARY KEY,
    module VARCHAR(20) NOT NULL,
    shop_code VARCHAR(50) NOT NULL,
    shop_name VARCHAR(200) NOT NULL,
    owner_email VARCHAR(254),
    core_company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',   -- active | revoked
    linked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoke_reason VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Only one ACTIVE link per shop in a module.
CREATE UNIQUE INDEX IF NOT EXISTS uq_module_links_active_shop
    ON module_links(module, shop_code)
    WHERE status = 'active';

-- Only one ACTIVE shop per Core company in each module.
CREATE UNIQUE INDEX IF NOT EXISTS uq_module_links_active_company
    ON module_links(module, core_company_id)
    WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_module_links_company ON module_links(core_company_id);
CREATE INDEX IF NOT EXISTS idx_module_links_shop ON module_links(shop_code);
CREATE INDEX IF NOT EXISTS idx_module_links_status ON module_links(status);

COMMIT;
