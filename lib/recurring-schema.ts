/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
import { query } from "@/lib/db";

/**
 * Verifies the recurring billing schema exists.
 * Schema is created by migrations (scripts/bootstrap-init-db.mjs);
 * runtime never alters it.
 */
export async function ensureRecurringBillingSchema(): Promise<boolean> {
  try {
    const columnRes = await query(`
      SELECT COUNT(*)::int AS count
      FROM information_schema.columns
      WHERE table_name = 'recurring_invoices'
        AND column_name IN ('billing_day', 'due_day', 'wht_rate', 'last_billed_at')
    `);
    if (Number(columnRes.rows[0]?.count || 0) !== 4) return false;

    const tableRes = await query(`
      SELECT 1 FROM information_schema.tables
      WHERE table_name = 'subscription_invoices' LIMIT 1
    `);
    return tableRes.rows.length > 0;
  } catch {
    return false;
  }
}
