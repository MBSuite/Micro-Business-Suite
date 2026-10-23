-- Create company_module_settings table
CREATE TABLE IF NOT EXISTS company_module_settings (
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  module_id VARCHAR(100) NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  PRIMARY KEY (company_id, module_id)
);
