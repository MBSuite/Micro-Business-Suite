// app/api/crm/members/[contactId]/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth, getUserCompanyId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ contactId: string }> }) {
  const { contactId } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = await getUserCompanyId(session.user.id);

  const { rows: accRows } = await query(
    `SELECT la.*, c.name, c.phone, c.email FROM loyalty_accounts la JOIN contacts c ON c.id = la.contact_id WHERE la.company_id = $1 AND la.contact_id = $2`,
    [companyId, contactId]
  );
  const account = accRows[0] || null;

  const { rows: txs } = await query(
    `SELECT * FROM loyalty_transactions WHERE company_id = $1 AND account_id = $2 ORDER BY created_at DESC LIMIT 50`,
    [companyId, account?.id || 0]
  );

  const { rows: purchases } = await query(
    `SELECT i.id, i.invoice_number, i.issue_date, i.total_amount, i.status
     FROM invoices i WHERE i.company_id = $1 AND i.contact_id = $2 ORDER BY i.issue_date DESC LIMIT 50`,
    [companyId, contactId]
  );

  return NextResponse.json({ success: true, account, transactions: txs, purchases });
}
