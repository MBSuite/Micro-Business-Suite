/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
// app/api/fb/orders/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth, getUserCompanyId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = await getUserCompanyId(session.user.id);
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const tableId = url.searchParams.get("table_id");
  let q = `SELECT o.*, t.code AS table_code, t.name AS table_name FROM fb_orders o LEFT JOIN fb_tables t ON t.id = o.table_id WHERE o.company_id = $1`;
  const params: any[] = [companyId];
  if (status) { params.push(status); q += ` AND o.status = $${params.length}`; }
  if (tableId) { params.push(Number(tableId)); q += ` AND o.table_id = $${params.length}`; }
  q += ` ORDER BY o.created_at DESC`;
  const { rows } = await query(q, params);
  // attach items
  for (const o of rows) {
    const { rows: items } = await query(`SELECT * FROM fb_order_items WHERE order_id = $1 ORDER BY id`, [o.id]);
    o.items = items;
  }
  return NextResponse.json({ success: true, data: rows });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = await getUserCompanyId(session.user.id);
  const b = await req.json();
  // order number
  const { rows: last } = await query(`SELECT order_number FROM fb_orders WHERE company_id=$1 ORDER BY id DESC LIMIT 1`, [companyId]);
  let n = 1;
  if (last.length > 0) {
    const m = String(last[0].order_number).match(/(\d+)$/);
    if (m) n = Number(m[1]) + 1;
  }
  const orderNumber = `FB${String(n).padStart(4, "0")}`;
  const { rows } = await query(
    `INSERT INTO fb_orders (company_id, table_id, order_number, status, notes, created_by) VALUES ($1,$2,$3,'open',$4,$5) RETURNING *`,
    [companyId, b.table_id || null, orderNumber, b.notes || null, Number(session.user.id)]
  );
  const order = rows[0];
  // mark table occupied
  if (b.table_id) {
    await query(`UPDATE fb_tables SET status='occupied', current_order_id=$1, updated_at=NOW() WHERE id=$2`, [order.id, b.table_id]);
  }
  return NextResponse.json({ success: true, data: order });
}
