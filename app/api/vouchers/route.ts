/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth, getUserCompanyId } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized — not authenticated" },
        { status: 401 }
      );
    }

    const companyId = await getUserCompanyId(session.user.id);
    const { rows } = await query(
      `
      SELECT * FROM payment_vouchers
      WHERE company_id = $1
      ORDER BY issue_date DESC
    `,
      [companyId]
    );

    return NextResponse.json({ success: true, vouchers: rows });
  } catch (error: any) {
    console.error("GET /api/vouchers error", error);
    return NextResponse.json({ success: false, message: "Cannot fetch vouchers" }, { status: 500 });
  }
}
