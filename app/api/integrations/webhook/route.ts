/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
// app/api/integrations/webhook/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth, getUserCompanyId } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Generic inbound webhook for e-commerce/delivery platforms
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = await getUserCompanyId(session.user.id);
  const b = await req.json();
  const provider = String(b?.provider || "unknown");
  const event = String(b?.event || "order");
  // update last_sync_at for matching connection
  await query(
    `UPDATE integration_connections SET last_sync_at = NOW(), status = 'connected' WHERE company_id = $1 AND provider = $2`,
    [companyId, provider]
  );
  // If order payload provided, create an invoice
  if (b?.order && Array.isArray(b.order.items)) {
    const items = b.order.items;
    // invoice number
    let prefix = "INV";
    const { rows: s } = await query(
      `SELECT invoice_prefix FROM company_settings WHERE company_id = $1 LIMIT 1`,
      [companyId]
    );
    if (s.length > 0) prefix = s[0].invoice_prefix || "INV";
    const { rows: last } = await query(
      `SELECT invoice_number FROM invoices WHERE company_id = $2 AND invoice_number LIKE $1 ORDER BY id DESC LIMIT 1`,
      [`${prefix}%`, companyId]
    );
    let n = 1;
    if (last.length > 0) { const x = parseInt(String(last[0].invoice_number).replace(prefix, ""), 10); if (!isNaN(x)) n = x + 1; }
    const invoiceNumber = `${prefix}${String(n).padStart(3, "0")}`;
    let subtotal = 0;
    for (const it of items) subtotal += Number(it.qty || 0) * Number(it.price || 0);
    const vat = (subtotal * 7) / 100;
    const total = subtotal + vat;
    const { rows: inv } = await query(
      `INSERT INTO invoices (invoice_number, contact_id, net_amount, vat_amount, status, due_date, created_at, issue_date, company_id, discount_amount)
       VALUES ($1,NULL,$2,$3,'sent',CURRENT_DATE,NOW(),CURRENT_DATE,$4,0) RETURNING id`,
      [invoiceNumber, subtotal, vat, companyId]
    );
    const invoiceId = inv[0].id;
    for (const it of items) {
      await query(`INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, total_price) VALUES ($1,$2,$3,$4,$5,$6)`,
        [invoiceId, it.product_id || null, it.description || provider, Number(it.qty || 0), Number(it.price || 0), Number(it.qty || 0) * Number(it.price || 0)]);
    }
    return NextResponse.json({ success: true, event, invoiceId, invoiceNumber, total });
  }
  return NextResponse.json({ success: true, event, message: "synced" });
}
