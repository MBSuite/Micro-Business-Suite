-- =====================================================
-- Integration security test schema (isolated local container DB)
-- สร้างเฉพาะตารางที่ tests/integration-security.test.mjs สัมผัส
-- ไม่แตะ production schema — ใช้กับ Docker container ที่แยกจาก prod
-- =====================================================

CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    plan_type VARCHAR(50) NOT NULL DEFAULT 'TRIAL',
    max_users INTEGER NOT NULL DEFAULT 1,
    subscription_status VARCHAR(50) NOT NULL DEFAULT 'Active',
    expiry_date TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    license_key TEXT,
    customer_name VARCHAR(255),
    business_type VARCHAR(50) NOT NULL DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    status VARCHAR(20) DEFAULT 'active',
    company_id INTEGER REFERENCES companies(id),
    totp_secret TEXT,
    totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    totp_verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_system BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS user_groups (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    assigned_by INTEGER,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, group_id)
);

INSERT INTO groups (id, name, is_system)
VALUES (1, 'Superadmin', TRUE), (2, 'Admin', TRUE), (3, 'User', FALSE)
ON CONFLICT (id) DO NOTHING;
SELECT setval(pg_get_serial_sequence('groups', 'id'), GREATEST((SELECT MAX(id) FROM groups), 1));

CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(255),
    entity_type VARCHAR(255),
    entity_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS company_settings (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL DEFAULT 'Micro-Business-Suite',
    tax_id VARCHAR(50) NOT NULL DEFAULT '',
    address TEXT,
    name VARCHAR(255),
    invoice_prefix VARCHAR(20) DEFAULT 'INV',
    logo_url TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    vat_rate NUMERIC(5,2) DEFAULT 7.00,
    withholding_tax_rate NUMERIC(5,2) DEFAULT 3.00,
    is_vat_registered BOOLEAN DEFAULT TRUE,
    currency VARCHAR(10) DEFAULT 'THB',
    quotation_prefix VARCHAR(20) DEFAULT 'QT',
    receipt_prefix VARCHAR(20) DEFAULT 'REC',
    journal_prefix VARCHAR(20) DEFAULT 'GJ',
    bank_name VARCHAR(255),
    bank_account_name VARCHAR(255),
    bank_account_number VARCHAR(50),
    bank_branch VARCHAR(255),
    invoice_footer TEXT,
    quotation_footer TEXT,
    receipt_footer TEXT,
    rd_client_id VARCHAR(255),
    rd_client_secret VARCHAR(255),
    rd_api_key VARCHAR(255),
    rd_base_url VARCHAR(255),
    rd_enabled BOOLEAN DEFAULT FALSE,
    google_client_id VARCHAR(255),
    google_client_secret VARCHAR(255),
    google_refresh_token TEXT,
    google_redirect_uri VARCHAR(255),
    google_drive_enabled BOOLEAN DEFAULT FALSE,
    google_drive_account_email VARCHAR(320),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS company_settings_company_id_key
    ON company_settings(company_id)
    WHERE company_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS company_module_settings (
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    module_id VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER,
    PRIMARY KEY (company_id, module_id)
);

CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(100),
    address TEXT,
    tax_id VARCHAR(50),
    company_id INTEGER REFERENCES companies(id)
);

CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE,
    contact_id INTEGER,
    net_amount DECIMAL(15,2) NOT NULL,
    vat_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'sent',
    quotation_id INTEGER,
    company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id),
    product_id INTEGER,
    description TEXT,
    quantity NUMERIC,
    unit_price NUMERIC,
    total_price NUMERIC
);

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    payment_no VARCHAR(50) UNIQUE,
    invoice_id INTEGER REFERENCES invoices(id),
    amount DECIMAL(15,2),
    payment_date DATE,
    payment_method VARCHAR(100),
    status VARCHAR(20) DEFAULT 'completed',
    notes TEXT,
    contact_id INTEGER,
    wht_amount DECIMAL(15,2) DEFAULT 0,
    vat_amount DECIMAL(15,2) DEFAULT 0,
    company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quotations (
    id SERIAL PRIMARY KEY,
    quotation_number VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    expense_number VARCHAR(50),
    title VARCHAR(255),
    contact_id INTEGER,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'paid',
    company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS payment_vouchers (
    id SERIAL PRIMARY KEY,
    voucher_no VARCHAR(50),
    issue_date DATE,
    amount DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS integration_connections (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'disconnected',
    last_sync_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Master tables ภายใต้ tenant scope (สอดคล้องกับ migrations/add_company_tenant_scope_master_tables.sql)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    category_name VARCHAR(100),
    type VARCHAR(50),
    sku_number VARCHAR(50),
    source_info TEXT,
    storage_location VARCHAR(255),
    stock_quantity INTEGER DEFAULT 0,
    price NUMERIC DEFAULT 0,
    product_notes TEXT,
    supplier_cost NUMERIC DEFAULT 0,
    markup_rate NUMERIC DEFAULT 0,
    company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS product_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    description TEXT,
    company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    service_code VARCHAR(50),
    name VARCHAR(255),
    description TEXT,
    service_type VARCHAR(50) DEFAULT 'service',
    unit_price NUMERIC DEFAULT 0,
    is_wht_applicable BOOLEAN DEFAULT TRUE,
    company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reminders (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'pending',
    type VARCHAR(20) DEFAULT 'manual',
    company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- chart_of_accounts: global master (ไม่ tenant scope) — ใช้ร่วมทุกบริษัท
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id SERIAL PRIMARY KEY,
    account_code VARCHAR(20) UNIQUE NOT NULL,
    account_name_th VARCHAR(255) NOT NULL,
    account_name_en VARCHAR(255),
    account_type VARCHAR(50),
    account_category VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS journal_entries (
    id SERIAL PRIMARY KEY,
    company_id INTEGER,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference_no VARCHAR(50),
    journal_type VARCHAR(20),
    reference_type VARCHAR(50),
    reference_id INTEGER,
    debit_account_id INTEGER,
    credit_account_id INTEGER,
    description TEXT,
    amount DECIMAL(15,2) DEFAULT 0,
    vat_amount DECIMAL(15,2) DEFAULT 0,
    document_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_recovery_codes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO company_settings (name)
SELECT 'Integration Test Co' WHERE NOT EXISTS (SELECT 1 FROM company_settings);

INSERT INTO companies (name, plan_type, max_users, subscription_status)
SELECT 'Integration Test Default', 'TRIAL', 1, 'Active'
WHERE NOT EXISTS (SELECT 1 FROM companies);