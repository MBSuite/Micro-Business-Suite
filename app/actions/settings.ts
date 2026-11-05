/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth, getUserCompanyId } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";

export async function updateCompanySettings(data: any) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    if (!(await isAdmin(session.user.id))) return { success: false, error: "Forbidden" };
    const companyId = await getUserCompanyId(session.user.id);

    const current = await query(
      "SELECT id FROM company_settings WHERE company_id = $1 LIMIT 1",
      [companyId]
    );
    if (!current.rows.length) {
      return { success: false, error: "Company settings not found for this company." };
    }

    await query(
      `UPDATE company_settings SET name=$1, tax_id=$2, phone=$3, email=$4, address=$5, bank_name=$6, 
       bank_account_name=$7, bank_account_number=$8, bank_branch=$9, vat_rate=$10, withholding_tax_rate=$11, 
       is_vat_registered=$12, currency=$13, invoice_prefix=$14, quotation_prefix=$15
       WHERE company_id=$16`,
      [data.name, data.tax_id, data.phone, data.email, data.address, data.bank_name, data.bank_account_name, data.bank_account_number, data.bank_branch, data.vat_rate, data.withholding_tax_rate, data.is_vat_registered, data.currency, data.invoice_prefix, data.quotation_prefix,
       companyId]
    );
    revalidatePath("/settings");
    return { success: true };
  } catch (err: any) { return { success: false, error: err.message }; }
}

export async function getDocumentPatterns() {
  try {
    const res = await query("SELECT * FROM document_patterns ORDER BY id ASC");
    return { success: true, data: res.rows };
  } catch (err: any) { return { success: false, error: err.message }; }
}

export async function updateDocumentPattern(id: number, data: any) {
  try {
    await query(
      `UPDATE document_patterns SET prefix=$1, include_year=$2, include_month=$3, separator=$4, digits=$5, updated_at=CURRENT_TIMESTAMP WHERE id=$6`,
      [data.prefix, data.include_year, data.include_month, data.separator, data.digits, id]
    );
    revalidatePath("/settings/patterns");
    return { success: true };
  } catch (err: any) { return { success: false, error: err.message }; }
}

export async function getNextReferenceNo(type: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    const companyId = await getUserCompanyId(session.user.id);
    const journalType = type.toLowerCase();
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    const { rows } = await query(
      `SELECT COUNT(*) as count FROM journal_entries 
       WHERE journal_type = $1 AND fiscal_year = $2 AND fiscal_month = $3 AND company_id = $4`,
      [journalType, year, month, companyId]
    );
    
    const prefix = type.toUpperCase().substring(0, 2);
    const nextNum = (parseInt(rows[0].count) + 1).toString().padStart(3, '0');
    const result = `${prefix}-${year}-${String(month).padStart(2, '0')}-${nextNum}`;
    
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getDashboardAlerts() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    const companyId = await getUserCompanyId(session.user.id);
    const r = await query(
      "SELECT * FROM reminders WHERE due_date >= NOW() AND status='pending' AND company_id = $1 LIMIT 5",
      [companyId]
    );
    const i = await query(
      "SELECT * FROM invoices WHERE status != 'paid' AND company_id = $1 LIMIT 5",
      [companyId]
    );
    return { success: true, data: { reminders: r.rows, invoices: i.rows } };
  } catch (err: any) { return { success: false, error: err.message }; }
}
