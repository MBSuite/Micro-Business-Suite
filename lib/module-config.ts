import { query } from "@/lib/db";

export async function ensureModuleConfigSchema(): Promise<boolean> {
  try {
    const { rows } = await query(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'company_module_settings' LIMIT 1
    `);
    return rows.length > 0;
  } catch (e) {
    return false;
  }
}

export async function getCompanyModuleOverrides(companyId: number): Promise<Record<string, boolean>> {
  const schemaExists = await ensureModuleConfigSchema();
  if (!schemaExists) {
    throw new Error("Schema 'company_module_settings' is missing. Run database bootstrap (scripts/bootstrap-init-db.mjs) before using this feature.");
  }
  const result = await query(
    `SELECT module_id, is_enabled FROM company_module_settings WHERE company_id = $1`,
    [companyId]
  );

  const overrides: Record<string, boolean> = {};
  for (const row of result.rows) {
    overrides[String(row.module_id)] = row.is_enabled === true;
  }
  return overrides;
}

export async function saveCompanyModuleOverrides(
  companyId: number,
  overrides: Record<string, boolean>,
  updatedBy: number
) {
  const schemaExists = await ensureModuleConfigSchema();
  if (!schemaExists) {
    throw new Error("Schema 'company_module_settings' is missing. Run database bootstrap (scripts/bootstrap-init-db.mjs) before using this feature.");
  }
  const entries = Object.entries(overrides);

  for (const [moduleId, isEnabled] of entries) {
    await query(
      `
        INSERT INTO company_module_settings (company_id, module_id, is_enabled, updated_at, updated_by)
        VALUES ($1, $2, $3, NOW(), $4)
        ON CONFLICT (company_id, module_id)
        DO UPDATE SET
          is_enabled = EXCLUDED.is_enabled,
          updated_at = NOW(),
          updated_by = EXCLUDED.updated_by
      `,
      [companyId, moduleId, !!isEnabled, updatedBy]
    );
  }
}

