// =====================================================
// Micro Business Suite: Company Settings & Branding
// Centralized company configuration management
// Copyright (c) 2026 Micro Business Suite. All Rights Reserved.
// =====================================================

import { query } from '@/lib/db';

export interface CompanySettings {
  id?: number;
  // Canonical DB column is `name`; `company_name` kept as a public alias for
  // backward compatibility with consumers (tax-reports, page.tsx, etc.).
  name?: string;
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

// Canonical DB column names (the live schema uses `name`, not `company_name`).
const SETTINGS_FIELDS = [
  'name',
  'tax_id',
  'address',
  'logo_url',
  'phone',
  'email',
  'website'
] as const;

// Allow clients that still send `company_name` to update the `name` column.
const FIELD_ALIASES: Record<string, string> = {
  company_name: 'name',
};

function sanitizeSettings(settings: Record<string, unknown>): Partial<CompanySettings> {
  const out: Partial<CompanySettings> = {};
  for (const key of SETTINGS_FIELDS) {
    const value = settings[key];
    if (typeof value === 'string') {
      out[key] = value;
    }
  }
  // Backward-compat alias: clients may still send `company_name`.
  if (typeof settings.company_name === 'string' && !('name' in settings)) {
    out.name = settings.company_name;
  }
  for (const [alias, canonical] of Object.entries(FIELD_ALIASES)) {
    if (typeof settings[alias] === 'string' && typeof settings[canonical] !== 'string') {
      (out as Record<string, unknown>)[canonical] = settings[alias];
    }
  }
  return out;
}

// Initialize company settings table
export async function ensureCompanySettingsTable(): Promise<boolean> {
  try {
    const { rows } = await query(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'company_settings' LIMIT 1
    `);
    return rows.length > 0;
  } catch (e) {
    return false;
  }
}

// Get company settings
export async function getCompanySettings(): Promise<{ success: boolean; data?: CompanySettings; error?: string }> {
  try {
    const settingsSchemaExists = await ensureCompanySettingsTable();
    if (!settingsSchemaExists) {
      return { success: false, error: "Company settings schema is missing. Run database bootstrap first." };
    }
    const { rows } = await query(
      `SELECT name, tax_id, address, logo_url, phone, email, website, created_at, updated_at
       FROM company_settings ORDER BY id DESC LIMIT 1`
    );

    const row = rows[0] as Record<string, unknown> | undefined;
    if (row) {
      row.company_name = row.name;
    }

    return {
      success: true,
      data: row as unknown as CompanySettings
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
    const settingsSchemaExists = await ensureCompanySettingsTable();
    if (!settingsSchemaExists) {
      return { success: false, error: "Company settings schema is missing. Run database bootstrap first." };
    }

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

    const outData: Record<string, unknown> = { ...sanitized };
    if (typeof outData.name === 'string') {
      outData.company_name = outData.name;
    }
    return { success: true, data: outData as Partial<CompanySettings> };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
