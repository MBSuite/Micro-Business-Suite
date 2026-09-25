import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/lib/auth";

// Whitelist of non-sensitive company fields. Credentials such as
// OAuth client secrets, refresh tokens and RD portal keys must never
// be returned to the browser, even to authenticated users.
const SAFE_COMPANY_COLUMNS = [
  "id",
  "name",
  "tax_id",
  "phone",
  "email",
  "address",
  "website",
  "logo_url",
  "vat_rate",
  "withholding_tax_rate",
  "is_vat_registered",
  "currency",
  "invoice_prefix",
  "quotation_prefix",
  "receipt_prefix",
  "journal_prefix",
  "invoice_footer",
  "quotation_footer",
  "receipt_footer",
  "bank_name",
  "bank_account_name",
  "bank_account_number",
  "bank_branch",
  "rd_base_url",
  "rd_enabled",
  "google_redirect_uri",
  "google_drive_enabled",
  "created_at",
  "updated_at",
].join(", ");

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized — not authenticated" },
        { status: 401 }
      );
    }

    // Scope ตามบริษัทของ session user (ป้องกัน cross-tenant เมื่อ deployment มีหลายบริษัท)
    const userRes = await query("SELECT company_id FROM users WHERE id = $1", [
      session.user.id,
    ]);
    const companyId = userRes.rows[0]?.company_id ?? null;

    // company_settings เดิมเป็น singleton — ถ้ายังไม่มีคอลัมน์ company_id ให้ใช้ single-row เดิม
    const colRes = await query(
      `SELECT 1 FROM information_schema.columns
       WHERE table_name = 'company_settings' AND column_name = 'company_id'`
    );
    const hasCompanyColumn = colRes.rows.length > 0;

    const result = hasCompanyColumn
      ? await query(
          `SELECT ${SAFE_COMPANY_COLUMNS} FROM company_settings
           WHERE company_id = $1 OR company_id IS NULL
           ORDER BY (company_id = $1) DESC, id ASC LIMIT 1`,
          [companyId]
        )
      : await query(`SELECT ${SAFE_COMPANY_COLUMNS} FROM company_settings LIMIT 1`);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json({ company: result.rows[0] });
  } catch (e) {
    console.error("GET company error:", e);
    return NextResponse.json({ error: "Failed to fetch company" }, { status: 500 });
  }
}