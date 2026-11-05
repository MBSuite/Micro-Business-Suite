/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth, getUserCompanyId } from "@/lib/auth";

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

    const companyId = await getUserCompanyId(session.user.id);
    const result = await query(
      `SELECT ${SAFE_COMPANY_COLUMNS} FROM company_settings
       WHERE company_id = $1 LIMIT 1`,
      [companyId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json({ company: result.rows[0] });
  } catch (e) {
    console.error("GET company error:", e);
    return NextResponse.json({ error: "Failed to fetch company" }, { status: 500 });
  }
}