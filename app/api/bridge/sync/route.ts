/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/bridge/sync/route.ts
// Bridge API: Suite -> MBS Core finance event sync (REST API + Webhook)
// Loose coupling, versioning, idempotency. Does NOT touch /api/integrations/webhook.
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth, getUserCompanyId } from "@/lib/auth";
import { createJournalEntry } from "@/lib/journaling";
import { COA_ACCOUNTS } from "@/lib/journaling";
import {
  validateBridgeSyncPayload,
  validateOrderPaidData,
  ALLOWED_EVENTS,
} from "@/lib/bridge-sync-validation.mjs";
import { hasBridgeServiceToken } from "@/lib/bridge-auth.mjs";

export const dynamic = "force-dynamic";

const bad = (msg: string, status = 400) => NextResponse.json({ success: false, error: msg }, { status });

export async function POST(req: Request) {
  const configuredToken = process.env.MBS_BRIDGE_TOKEN || "";
  const isService = hasBridgeServiceToken(req, configuredToken);
  const session = await auth();
  if (!isService && !session?.user?.id) return bad("Unauthorized", 401);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid JSON body");
  }

  const v = validateBridgeSyncPayload(body);
  if (!v.ok) return bad(v.error as string);
  const { event, idempotencyKey, companyId: bodyCompanyId, data } = v.value!;

  const od = validateOrderPaidData(data);
  if (!od.ok) return bad(od.error as string);

  let companyId: number;
  if (isService) {
    if (bodyCompanyId) companyId = bodyCompanyId;
    else return bad("company_id is required for service sync");
  } else {
    if (!session?.user?.id) return bad("Unauthorized", 401);
    companyId = await getUserCompanyId(session.user.id);
  }

  // Idempotency check
  try {
    const { rows: existing } = await query(
      `SELECT id, status, result FROM bridge_sync_log WHERE idempotency_key = $1 LIMIT 1`,
      [idempotencyKey]
    );
    if (existing.length > 0) {
      return NextResponse.json({
        success: existing[0].status === "success",
        idempotent: true,
        sync_id: existing[0].id,
        result: existing[0].result,
      });
    }
  } catch (e: any) {
    // Table may not exist yet
    if (String(e?.message || "").includes("bridge_sync_log")) {
      return bad("bridge_sync_log table missing. Run migration add_bridge_sync_log.sql first.", 503);
    }
    return bad(e?.message || "Idempotency check failed", 500);
  }

  const pool = (await import("@/lib/db")).default;
  const client = await pool.connect();
  let syncId: number | null = null;
  try {
    await client.query("BEGIN");

    // Process event
    let result: any = {};
    if (event === "order.paid" || event === "payment.received") {
      const orderId = data.order_id || data.id || null;
      const items = Array.isArray(data.items) ? data.items : [];
      const tableNumber = data.table_number || data.table || null;
      const paymentMethod = String(data.payment_method || "cash");
      const paidAt = data.paid_at ? new Date(data.paid_at) : new Date();
      const paidDate = paidAt.toISOString().split("T")[0];

      // subtotal
      let subtotal = 0;
      for (const it of items) subtotal += Number(it.qty || 0) * Number(it.price || 0);
      if (subtotal === 0 && data.total) subtotal = Number(data.total);
      const vatRate = 7;
      const vat = (subtotal * vatRate) / 100;
      const total = subtotal + vat;
      const netAmount = subtotal;

      // invoice number
      let prefix = "INV";
      const { rows: s } = await client.query(
        `SELECT invoice_prefix FROM company_settings WHERE company_id = $1 LIMIT 1`,
        [companyId]
      );
      if (s.length > 0) prefix = s[0].invoice_prefix || "INV";
      const { rows: last } = await client.query(
        `SELECT invoice_number FROM invoices WHERE company_id = $2 AND invoice_number LIKE $1 ORDER BY id DESC LIMIT 1`,
        [`${prefix}%`, companyId]
      );
      let n = 1;
      if (last.length > 0) {
        const x = parseInt(String(last[0].invoice_number).replace(prefix, ""), 10);
        if (!isNaN(x)) n = x + 1;
      }
      const invoiceNumber = `${prefix}${String(n).padStart(3, "0")}`;

      const { rows: inv } = await client.query(
        `INSERT INTO invoices (invoice_number, contact_id, net_amount, vat_amount, status, due_date, created_at, issue_date, company_id, discount_amount)
         VALUES ($1,NULL,$2,$3,'paid',CURRENT_DATE,NOW(),$4,$5,0) RETURNING id`,
        [invoiceNumber, netAmount, vat, paidDate, companyId]
      );
      const invoiceId = inv[0].id;

      for (const it of items) {
        await client.query(
          `INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, total_price) VALUES ($1,$2,$3,$4,$5,$6)`,
          [invoiceId, it.product_id || null, it.product_name || it.description || "item", Number(it.qty || 0), Number(it.price || 0), Number(it.qty || 0) * Number(it.price || 0)]
        );
      }

      // payment record
      const paymentNo = `BRG-${invoiceId}`;
      await client.query(
        `INSERT INTO payments (payment_no, payment_date, contact_id, invoice_id, amount, payment_method, status, wht_amount, company_id)
         VALUES ($1,$2,NULL,$3,$4,$5,'completed',0,$6)`,
        [paymentNo, paidDate, invoiceId, total, paymentMethod, companyId]
      );

      // journal entries: debit cash, credit revenue + VAT
      const revenueRes = await createJournalEntry(
        {
          entry_date: paidDate,
          journal_type: "sales",
          reference_type: "invoice",
          reference_id: invoiceId,
          description: `รายได้จาก Suite order #${orderId || invoiceNumber}`,
          debit_account_id: COA_ACCOUNTS.CASH,
          credit_account_id: COA_ACCOUNTS.SALES_REVENUE,
          amount: netAmount,
          document_number: invoiceNumber,
          notes: `bridge sync ${idempotencyKey}`,
        },
        { query: client.query.bind(client) },
        companyId
      );
      if (!revenueRes.success) throw new Error(revenueRes.error || "Revenue journal failed");

      if (vat > 0) {
        const vatRes = await createJournalEntry(
          {
            entry_date: paidDate,
            journal_type: "sales",
            reference_type: "invoice",
            reference_id: invoiceId,
            description: `ภาษีขายจาก Suite order #${orderId || invoiceNumber}`,
            debit_account_id: COA_ACCOUNTS.CASH,
            credit_account_id: COA_ACCOUNTS.VAT_PAYABLE,
            amount: vat,
            vat_rate: vatRate,
            vat_amount: vat,
            document_number: invoiceNumber,
            notes: `bridge sync ${idempotencyKey}`,
          },
          { query: client.query.bind(client) },
          companyId
        );
        if (!vatRes.success) throw new Error(vatRes.error || "VAT journal failed");
      }

      result = {
        invoice_id: invoiceId,
        invoice_number: invoiceNumber,
        net_amount: netAmount,
        vat_amount: vat,
        total,
        payment_no: paymentNo,
        order_id: orderId,
        table_number: tableNumber,
      };
    }

    // Insert idempotency log
    const { rows: logRows } = await client.query(
      `INSERT INTO bridge_sync_log (idempotency_key, event, company_id, status, result)
       VALUES ($1,$2,$3,'success',$4) RETURNING id`,
      [idempotencyKey, event, companyId, JSON.stringify(result)]
    );
    syncId = logRows[0].id;

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      sync_id: syncId,
      event,
      company_id: companyId,
      result,
    });
  } catch (e: any) {
    try { await client.query("ROLLBACK"); } catch {}
    // Record failure (best effort)
    try {
      await query(
        `INSERT INTO bridge_sync_log (idempotency_key, event, company_id, status, error)
         VALUES ($1,$2,$3,'failed',$4)`,
        [idempotencyKey, event, companyId, String(e?.message || e)]
      );
    } catch {}
    console.error("Bridge sync error:", e);
    return NextResponse.json({ success: false, error: e?.message || "Sync failed" }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function GET(req: Request) {
  const hasServiceToken = hasBridgeServiceToken(req, process.env.MBS_BRIDGE_TOKEN);
  if (!hasServiceToken) {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store",
            "WWW-Authenticate": "Bearer",
          },
        }
      );
    }
  }

  return NextResponse.json({
    success: true,
    endpoint: "/api/bridge/sync",
    version: "1.0",
    allowed_events: Array.from(ALLOWED_EVENTS),
    auth: "Bearer MBS_BRIDGE_TOKEN or session cookie",
  });
}
