/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
// app/api/pos/checkout/route.ts
import { NextResponse } from "next/server";
import { auth, getUserCompanyId } from "@/lib/auth";
import { assertCompanyQuota } from "@/lib/company-gate";
import { createSalesJournalEntry } from "@/lib/journaling";
import { createReceiptJournalEntry } from "@/lib/journaling";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const companyId = await getUserCompanyId(session.user.id);
  const quota = await assertCompanyQuota(session.user.id);
  if (!quota.ok) {
    return NextResponse.json({ error: quota.error }, { status: 403 });
  }

  const body = await req.json();
  const items: any[] = Array.isArray(body?.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json({ error: "ตะกร้าว่าง" }, { status: 400 });
  }

  const vatRate = Number(body?.vatRate ?? 7);
  const isVatRegistered = body?.isVatRegistered !== false;
  const paymentMethod = String(body?.paymentMethod || "cash");
  const contactId = body?.contactId ? Number(body.contactId) : null;
  const discountTotalInput = Number(body?.discountTotal || 0);
  const date = body?.date || new Date().toISOString().split("T")[0];

  const pool = (await import("@/lib/db")).default;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // invoice number
    let prefix = "INV";
    const sRes = await client.query(`SELECT invoice_prefix FROM company_settings LIMIT 1`);
    if (sRes.rows.length > 0) prefix = sRes.rows[0].invoice_prefix || "INV";
    const lastRes = await client.query(
      `SELECT invoice_number FROM invoices WHERE invoice_number LIKE $1 ORDER BY id DESC LIMIT 1`,
      [`${prefix}%`]
    );
    let nextNum = 1;
    if (lastRes.rows.length > 0) {
      const n = parseInt(String(lastRes.rows[0].invoice_number).replace(prefix, ""), 10);
      if (!isNaN(n)) nextNum = n + 1;
    }
    const invoiceNumber = `${prefix}${String(nextNum).padStart(3, "0")}`;

    // compute amounts
    let subtotal = 0;
    for (const it of items) {
      subtotal += Number(it.qty || 0) * Number(it.price || 0);
    }
    let promotionId: number | null = body?.promotionId ? Number(body.promotionId) : null;
    let evalDiscount = 0;
    if (!discountTotalInput) {
      const { evaluateBestPromotion } = await import("@/lib/promotions");
      const cartLines = items.map((it: any) => ({ productId: it.productId ? Number(it.productId) : null, qty: Number(it.qty || 0), price: Number(it.price || 0) }));
      const pres = await evaluateBestPromotion(companyId, cartLines, subtotal);
      if (pres.promotion) {
        promotionId = pres.promotion.id;
        evalDiscount = pres.discount;
      }
    }
    const discountTotal = discountTotalInput || evalDiscount;
    const netAmount = Math.max(subtotal - discountTotal, 0);
    const vatAmount = isVatRegistered ? (netAmount * vatRate) / 100 : 0;
    const totalAmount = netAmount + vatAmount;

    // insert invoice
    const invRes = await client.query(
      `INSERT INTO invoices (invoice_number, contact_id, net_amount, vat_amount, status, due_date, created_at, issue_date, quotation_id, company_id, discount_amount, is_service)
       VALUES ($1,$2,$3,$4,'paid',$5,NOW(),$6,NULL,$7,$8,false) RETURNING id`,
      [invoiceNumber, contactId, netAmount, vatAmount, date, date, companyId, discountTotal]
    );
    const invoiceId = invRes.rows[0].id;

    for (const it of items) {
      await client.query(
        `INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, total_price)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          invoiceId,
          it.productId ? Number(it.productId) : null,
          it.desc || "",
          Number(it.qty || 0),
          Number(it.price || 0),
          Number(it.qty || 0) * Number(it.price || 0),
        ]
      );
    }

    // journal
    const jr = await createSalesJournalEntry(
      invoiceId,
      invoiceNumber,
      contactId || 0,
      netAmount,
      vatAmount,
      totalAmount,
      date,
      client,
      false
    );
    if (!jr.success) throw new Error(`Journal failed: ${jr.error}`);

    // payment
    const paymentNo = `RC-${invoiceNumber}`;
    const payRes = await client.query(
      `INSERT INTO payments (payment_no, invoice_id, amount, payment_date, payment_method, status, notes, vat_amount, wht_amount, company_id)
       VALUES ($1,$2,$3,$4,$5,'completed',$6,$7,0,$8) RETURNING id`,
      [paymentNo, invoiceId, totalAmount, date, paymentMethod, "POS checkout", vatAmount, companyId]
    );
    const paymentId = payRes.rows[0].id;

    const rjr = await createReceiptJournalEntry(
      paymentId,
      paymentNo,
      contactId || 0,
      totalAmount,
      date,
      client,
      0,
      vatAmount,
      false
    );
    if (!rjr.success) throw new Error(`Receipt journal failed: ${rjr.error}`);

    // stock deduction
    for (const it of items) {
      if (it.productId) {
        await client.query(
          `UPDATE products SET stock_quantity = GREATEST(COALESCE(stock_quantity,0) - $1, 0),
                               stock_qty = GREATEST(COALESCE(stock_qty,0) - $1, 0)
           WHERE id = $2 AND company_id = $3`,
          [Number(it.qty || 0), Number(it.productId), companyId]
        );
      }
    }

    // multi-branch stock deduction
    const branchId = body?.branchId ? Number(body.branchId) : null;
    if (branchId) {
      for (const it of items) {
        if (it.productId) {
          await client.query(
            `INSERT INTO branch_stock (company_id, branch_id, product_id, variant_id, stock_quantity, stock_qty)
             SELECT $1,$2,$3,NULL,0,0
             WHERE NOT EXISTS (SELECT 1 FROM branch_stock WHERE branch_id=$2 AND product_id=$3 AND variant_id IS NULL)`,
            [companyId, branchId, Number(it.productId)]
          );
          await client.query(
            `UPDATE branch_stock SET stock_quantity = GREATEST(COALESCE(stock_quantity,0) - $1, 0),
                                     stock_qty = GREATEST(COALESCE(stock_qty,0) - $1, 0),
                                     updated_at = NOW()
             WHERE branch_id = $2 AND product_id = $3 AND variant_id IS NULL`,
            [Number(it.qty || 0), branchId, Number(it.productId)]
          );
        }
      }
    }

    await client.query("COMMIT");

    if (promotionId) {
      try { await (await import("@/lib/promotions")).incrementUsage(promotionId); } catch {}
    }

    // CRM loyalty accrual
    if (contactId) {
      try {
        const { accruePoints } = await import("@/lib/loyalty");
        await accruePoints(companyId, contactId, invoiceId, totalAmount, Number(session.user.id));
      } catch (e) { console.error("loyalty accrue error", e); }
    }

    return NextResponse.json({
      success: true,
      invoiceId,
      invoiceNumber,
      paymentId,
      paymentNo,
      totalAmount,
      promotionId,
      discountTotal,
    });
  } catch (e: any) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("pos checkout error", e);
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 });
  } finally {
    client.release();
  }
}
