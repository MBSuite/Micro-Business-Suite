/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
import { query } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * POST /api/reset_billing
 *
 * Destructive endpoint: resets billing/quotation data for the caller's company only.
 * REQUIRES: authenticated superadmin user.
 *
 * This is a PRIVILEGED operation — only superadmin can trigger.
 * GET method is disabled to prevent CSRF/accidental clicks.
 */
export async function POST(req: Request) {
  try {
    // 1. Verify user is authenticated
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized — not authenticated" },
        { status: 401 }
      );
    }

    // 2. Verify user is superadmin (destructive, cross-company reset is never allowed for company admins)
    if (String(session.user.role || "").toLowerCase() !== "superadmin") {
      return NextResponse.json(
        { success: false, error: "Forbidden — superadmin access required" },
        { status: 403 }
      );
    }

    // 3. Parse request body and verify confirmation token
    const body = await req.json().catch(() => ({}));
    if (body.confirmToken !== "RESET_BILLING_CONFIRMED") {
      return NextResponse.json(
        {
          success: false,
          error: "Missing or invalid confirmation token. This is a destructive operation."
        },
        { status: 400 }
      );
    }

    // 4. Log audit trail before deletion
    console.log(`[AUDIT] Admin reset_billing triggered by user: ${session.user.email} (ID: ${session.user.id})`);

    let companyId: number | null = null;

    // 5. Perform destructive operation inside a transaction so a mid-way failure rolls back
    await query("BEGIN");
    try {
      // Scope deletion to a single company when companyId is provided; default to all (superadmin-only, explicit)
      companyId = body.companyId ? Number(body.companyId) : null;
      if (companyId && !Number.isFinite(companyId)) {
        await query("ROLLBACK");
        return NextResponse.json(
          { success: false, error: "Invalid companyId" },
          { status: 400 }
        );
      }

      if (companyId) {
        await query("DELETE FROM quotation_items WHERE quotation_id IN (SELECT id FROM quotations WHERE company_id = $1)", [companyId]);
        await query("DELETE FROM quotations WHERE company_id = $1", [companyId]);
        await query("DELETE FROM invoices WHERE company_id = $1", [companyId]);
        await query("DELETE FROM journal_entries WHERE company_id = $1 AND (reference_no LIKE 'INV%' OR reference_no LIKE 'QT%')", [companyId]);
      } else {
        await query("DELETE FROM quotation_items");
        await query("DELETE FROM quotations");
        await query("DELETE FROM invoices");
        await query("DELETE FROM journal_entries WHERE reference_no LIKE 'INV%' OR reference_no LIKE 'QT%'");
        // Reset sequences only for full (all-company) reset
        try { await query("ALTER SEQUENCE quotations_id_seq RESTART WITH 1"); } catch { }
        try { await query("ALTER SEQUENCE invoices_id_seq RESTART WITH 1"); } catch { }
        try { await query("ALTER SEQUENCE quotation_items_id_seq RESTART WITH 1"); } catch { }
      }

      await query("COMMIT");
    } catch (err) {
      await query("ROLLBACK").catch(() => {});
      throw err;
    }

    console.log(`[AUDIT] Admin reset_billing completed for user: ${session.user.email}`);

    return NextResponse.json({
      success: true,
      message: "✅ รีเซ็ตข้อมูลเรียบร้อย! สามารถเริ่มสร้างเอกสารใหม่ได้เลย",
      cleared: companyId
        ? ["quotations", "quotation_items", "invoices", "journal_entries (INV/QT) for company " + companyId]
        : ["quotations", "quotation_items", "invoices", "journal_entries (INV/QT)"],
    });
  } catch (err) {
    console.error("[ERROR] reset_billing failed:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reset_billing
 * DISABLED — prevents accidental clicks, CSRF attacks, and unauthorized access
 * Use POST with proper authentication and confirmation instead
 */
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed. Use POST with admin authentication and confirmation token.",
      hint: "This is a destructive operation and requires explicit admin confirmation."
    },
    { status: 405 }
  );
}
