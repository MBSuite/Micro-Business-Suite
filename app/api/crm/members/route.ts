// app/api/crm/members/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth, getUserCompanyId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = await getUserCompanyId(session.user.id);
  const { rows } = await query(
    `SELECT c.id, c.name, c.phone, c.email, c.contact_type,
            la.id AS account_id, la.tier, la.points_balance, la.lifetime_points, la.total_spent, la.member_since, la.status
     FROM contacts c
     LEFT JOIN loyalty_accounts la ON la.contact_id = c.id AND la.company_id = c.company_id
     WHERE c.company_id = $1 AND (c.contact_type = 'CUSTOMER' OR c.contact_type = 'BOTH' OR c.type = 'customer' OR c.type = 'both')
     ORDER BY c.name`,
    [companyId]
  );
  return NextResponse.json({ success: true, data: rows });
}
