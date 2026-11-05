/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
// app/api/reports/sales-analytics/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth, getUserCompanyId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const companyId = await getUserCompanyId(session.user.id);
    const url = new URL(req.url);
    const from = url.searchParams.get("from") || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
    const to = url.searchParams.get("to") || new Date().toISOString().split("T")[0];

    // Daily totals
    const daily = await query(
      `SELECT issue_date::text AS day,
              COUNT(*)::int AS invoices,
              COALESCE(SUM(total_amount),0)::numeric AS total,
              COALESCE(SUM(net_amount),0)::numeric AS net,
              COALESCE(SUM(vat_amount),0)::numeric AS vat,
              COALESCE(SUM(discount_amount),0)::numeric AS discount
       FROM invoices
       WHERE company_id = $1 AND issue_date >= $2 AND issue_date <= $3
       GROUP BY issue_date ORDER BY issue_date`,
      [companyId, from, to]
    );

    // Monthly totals
    const monthly = await query(
      `SELECT to_char(issue_date, 'YYYY-MM') AS month,
              COUNT(*)::int AS invoices,
              COALESCE(SUM(total_amount),0)::numeric AS total
       FROM invoices
       WHERE company_id = $1 AND issue_date >= $2 AND issue_date <= $3
       GROUP BY to_char(issue_date, 'YYYY-MM') ORDER BY month`,
      [companyId, from, to]
    );

    // Top products
    const topProducts = await query(
      `SELECT COALESCE(p.name, ii.description) AS name,
              COALESCE(p.sku_number, p.sku) AS sku,
              SUM(ii.quantity)::int AS qty,
              COALESCE(SUM(ii.total_price),0)::numeric AS revenue
       FROM invoice_items ii
       LEFT JOIN products p ON p.id = ii.product_id
       JOIN invoices i ON i.id = ii.invoice_id
       WHERE i.company_id = $1 AND i.issue_date >= $2 AND i.issue_date <= $3
       GROUP BY COALESCE(p.name, ii.description), COALESCE(p.sku_number, p.sku)
       ORDER BY revenue DESC LIMIT 10`,
      [companyId, from, to]
    );

    // Peak hours (from created_at)
    const peakHours = await query(
      `SELECT EXTRACT(HOUR FROM created_at)::int AS hour,
              COUNT(*)::int AS invoices,
              COALESCE(SUM(total_amount),0)::numeric AS total
       FROM invoices
       WHERE company_id = $1 AND issue_date >= $2 AND issue_date <= $3
       GROUP BY EXTRACT(HOUR FROM created_at) ORDER BY hour`,
      [companyId, from, to]
    );

    // Payment methods
    const payMethods = await query(
      `SELECT COALESCE(payment_method,'unknown') AS method,
              COUNT(*)::int AS count,
              COALESCE(SUM(amount),0)::numeric AS total
       FROM payments
       WHERE company_id = $1 AND payment_date >= $2 AND payment_date <= $3
       GROUP BY COALESCE(payment_method,'unknown') ORDER BY total DESC`,
      [companyId, from, to]
    );

    // Summary
    const summary = await query(
      `SELECT COUNT(*)::int AS invoices,
              COALESCE(SUM(total_amount),0)::numeric AS total,
              COALESCE(SUM(net_amount),0)::numeric AS net,
              COALESCE(SUM(vat_amount),0)::numeric AS vat,
              COALESCE(SUM(discount_amount),0)::numeric AS discount,
              COALESCE(AVG(total_amount),0)::numeric AS avg
       FROM invoices
       WHERE company_id = $1 AND issue_date >= $2 AND issue_date <= $3`,
      [companyId, from, to]
    );

    return NextResponse.json({
      success: true,
      from,
      to,
      summary: summary.rows[0],
      daily: daily.rows,
      monthly: monthly.rows,
      topProducts: topProducts.rows,
      peakHours: peakHours.rows,
      payMethods: payMethods.rows,
    });
  } catch (e: any) {
    console.error("sales-analytics error", e);
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 });
  }
}
