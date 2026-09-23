// =====================================================
// Micro Business Suite: Company Settings & Branding
// Centralized company configuration management
// Copyright (c) 2026 Micro Business Suite. All Rights Reserved.
// =====================================================

import { query } from '@/lib/db';

export interface CompanySettings {
  id?: number;
  company_name: string;
  tax_id: string;
  address: string;
  logo_url?: string;
  phone?: string;
  email?: string;
  website?: string;
  created_at?: string;
  updated_at?: string;
}

const SETTINGS_FIELDS = [
  'company_name',
  'tax_id',
  'address',
  'logo_url',
  'phone',
  'email',
  'website'
] as const;

function sanitizeSettings(settings: Record<string, unknown>): Partial<CompanySettings> {
  const out: Partial<CompanySettings> = {};
  for (const key of SETTINGS_FIELDS) {
    const value = settings[key];
    if (typeof value === 'string') {
      out[key] = value;
    }
  }
  return out;
}

// Initialize company settings table
export async function ensureCompanySettingsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS company_settings (
      id SERIAL PRIMARY KEY,
      company_name VARCHAR(255) NOT NULL DEFAULT 'Micro Business Suite',
      tax_id VARCHAR(50) NOT NULL DEFAULT '',
      address TEXT,
      logo_url TEXT,
      phone VARCHAR(50),
      email VARCHAR(255),
      website VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert default settings if table is empty
  const existing = await query('SELECT COUNT(*) as count FROM company_settings');
  if (existing.rows[0].count === 0) {
    await query(`
      INSERT INTO company_settings (company_name, tax_id, address)
      VALUES ('Micro Business Suite', '', 'Company Address, Thailand')
    `);
  }
}

// Get company settings
export async function getCompanySettings(): Promise<{ success: boolean; data?: CompanySettings; error?: string }> {
  try {
    await ensureCompanySettingsTable();
    const { rows } = await query(
      `SELECT company_name, tax_id, address, logo_url, phone, email, website, created_at, updated_at
       FROM company_settings ORDER BY id DESC LIMIT 1`
    );
    
    return {
      success: true,
      data: rows[0] as CompanySettings
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Update company settings (whitelisted fields only — never build SQL from client keys)
export async function updateCompanySettings(settings: Record<string, unknown>): Promise<{ success: boolean; data?: Partial<CompanySettings>; error?: string }> {
  try {
    await ensureCompanySettingsTable();

    const sanitized = sanitizeSettings(settings);
    const fields = Object.keys(sanitized);
    const values = Object.values(sanitized);

    if (fields.length === 0) {
      return { success: true, data: {} };
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');

    await query(`
      UPDATE company_settings 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = (SELECT id FROM company_settings ORDER BY id DESC LIMIT 1)
    `, values);

    return { success: true, data: sanitized };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
