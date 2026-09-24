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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS company_settings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    invoice_prefix VARCHAR(20) DEFAULT 'INV'
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

INSERT INTO company_settings (name)
SELECT 'Integration Test Co' WHERE NOT EXISTS (SELECT 1 FROM company_settings);

INSERT INTO companies (name, plan_type, max_users, subscription_status)
SELECT 'Integration Test Default', 'TRIAL', 1, 'Active'
WHERE NOT EXISTS (SELECT 1 FROM companies);