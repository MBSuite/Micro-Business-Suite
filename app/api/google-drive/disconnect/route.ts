import { NextResponse } from "next/server";
import { auth, getUserCompanyId } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { query } from "@/lib/db";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const companyId = await getUserCompanyId(session.user.id);
    const result = await query(
      `UPDATE company_settings
       SET google_refresh_token = NULL, google_drive_account_email = NULL,
           google_drive_enabled = FALSE, updated_at = CURRENT_TIMESTAMP
       WHERE company_id = $1`,
      [companyId]
    );
    if (result.rowCount !== 1) {
      return NextResponse.json({ error: "Company settings not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Google Drive disconnect failed:", error);
    return NextResponse.json({ error: "Could not disconnect Google Drive" }, { status: 500 });
  }
}
