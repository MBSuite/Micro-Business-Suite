/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
// app/api/fb/orders/[id]/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth, getUserCompanyId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = await getUserCompanyId(session.user.id);
  const { rows } = await query(`SELECT o.*, t.code AS table_code, t.name AS table_name FROM fb_orders o LEFT JOIN fb_tables t ON t.id=o.table_id WHERE o.id=$1 AND o.company_id=$2`, [id, companyId]);
  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { rows: items } = await query(`SELECT * FROM fb_order_items WHERE order_id=$1 ORDER BY id`, [id]);
  rows[0].items = items;
  return NextResponse.json({ success: true, data: rows[0] });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = await getUserCompanyId(session.user.id);
  const b = await req.json();
  if (b.action === "add_item") {
    await query(
      `INSERT INTO fb_order_items (order_id, product_id, description, qty, price, total, notes) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [id, b.product_id || null, b.description, Number(b.qty || 1), Number(b.price || 0), Number(b.qty || 1) * Number(b.price || 0), b.notes || null]
    );
  } else if (b.action === "remove_item") {
    await query(`DELETE FROM fb_order_items WHERE id=$1 AND order_id=$2`, [b.item_id, id]);
  } else if (b.action === "kot") {
    // send to kitchen: create KOT with unsent items
    const { rows: items } = await query(`SELECT * FROM fb_order_items WHERE order_id=$1 AND kot_sent=FALSE`, [id]);
    if (items.length > 0) {
      const { rows: last } = await query(`SELECT kot_number FROM fb_kots WHERE company_id=$1 ORDER BY id DESC LIMIT 1`, [companyId]);
      let n = 1;
      if (last.length > 0) { const m = String(last[0].kot_number).match(/(\d+)$/); if (m) n = Number(m[1]) + 1; }
      const kotNumber = `KOT${String(n).padStart(4, "0")}`;
      await query(`INSERT INTO fb_kots (company_id, order_id, kot_number, items_json) VALUES ($1,$2,$3,$4)`,
        [companyId, id, kotNumber, JSON.stringify(items)]);
      await query(`UPDATE fb_order_items SET kot_sent=TRUE WHERE order_id=$1 AND kot_sent=FALSE`, [id]);
      await query(`UPDATE fb_orders SET status='kot_sent', updated_at=NOW() WHERE id=$1`, [id]);
    }
  } else if (b.action === "bill") {
    const { rows: items } = await query(`SELECT * FROM fb_order_items WHERE order_id=$1`, [id]);
    const subtotal = items.reduce((s: number, it: any) => s + Number(it.total || 0), 0);
    const vat = (subtotal * 7) / 100;
    const total = subtotal + vat;
    await query(`UPDATE fb_orders SET status='billed', subtotal=$1, vat=$2, total=$3, updated_at=NOW() WHERE id=$4`,
      [subtotal, vat, total, id]);
  } else if (b.action === "pay") {
    await query(`UPDATE fb_orders SET status='paid', closed_at=NOW(), updated_at=NOW() WHERE id=$1`, [id]);
    const { rows: o } = await query(`SELECT table_id FROM fb_orders WHERE id=$1`, [id]);
    if (o[0]?.table_id) {
      await query(`UPDATE fb_tables SET status='free', current_order_id=NULL, updated_at=NOW() WHERE id=$1`, [o[0].table_id]);
    }
  } else if (b.action === "cancel") {
    await query(`UPDATE fb_orders SET status='cancelled', closed_at=NOW(), updated_at=NOW() WHERE id=$1`, [id]);
    const { rows: o } = await query(`SELECT table_id FROM fb_orders WHERE id=$1`, [id]);
    if (o[0]?.table_id) {
      await query(`UPDATE fb_tables SET status='free', current_order_id=NULL, updated_at=NOW() WHERE id=$1`, [o[0].table_id]);
    }
  }
  // recompute subtotal/total on item changes
  if (b.action === "add_item" || b.action === "remove_item") {
    const { rows: items } = await query(`SELECT * FROM fb_order_items WHERE order_id=$1`, [id]);
    const subtotal = items.reduce((s: number, it: any) => s + Number(it.total || 0), 0);
    await query(`UPDATE fb_orders SET subtotal=$1, updated_at=NOW() WHERE id=$2`, [subtotal, id]);
  }
  const { rows } = await query(`SELECT * FROM fb_orders WHERE id=$1`, [id]);
  return NextResponse.json({ success: true, data: rows[0] });
}
