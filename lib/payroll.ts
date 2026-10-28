/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
import { query } from "@/lib/db";

export async function ensurePayrollSchema(): Promise<boolean> {
  try {
    const { rows } = await query(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'payroll_entries' LIMIT 1
    `);
    return rows.length > 0;
  } catch (e) {
    return false;
  }
}

