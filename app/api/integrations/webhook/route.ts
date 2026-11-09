import { NextResponse } from "next/server";
import pool, { query } from "@/lib/db";
import { auth, CompanyMappingError, getUserCompanyId } from "@/lib/auth";

export const dynamic = "force-dynamic";

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

// Generic inbound webhook for e-commerce/delivery platforms.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return jsonResponse({ error: "Unauthorized" }, 401);

  let companyId: number;
  try {
    companyId = await getUserCompanyId(session.user.id);
  } catch (error) {
    if (error instanceof CompanyMappingError) {
      return jsonResponse({ error: "User has no valid company assignment" }, 403);
    }
    throw error;
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const provider = String(body.provider || "unknown").trim();
  const event = String(body.event || "order").trim();
  const headerEventId = req.headers.get("Idempotency-Key")?.trim();
  const bodyEventId = typeof body.event_id === "string" ? body.event_id.trim() : "";
  if (headerEventId && bodyEventId && headerEventId !== bodyEventId) {
    return jsonResponse({ error: "Idempotency-Key does not match event_id" }, 400);
  }
  const eventId = headerEventId || bodyEventId;
  if (!eventId || eventId.length > 255) {
    return jsonResponse({ error: "Idempotency-Key or event_id (1-255 characters) is required" }, 400);
  }
  if (!provider || provider.length > 50 || !event || event.length > 100) {
    return jsonResponse({ error: "Invalid provider or event" }, 400);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const inserted = await client.query(
      `INSERT INTO integration_webhook_events (company_id, provider, event_id, event_name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (company_id, provider, event_id) DO NOTHING
       RETURNING event_id`,
      [companyId, provider, eventId, event]
    );

    if (inserted.rowCount === 0) {
      const existing = await client.query(
        `SELECT status, result
         FROM integration_webhook_events
         WHERE company_id = $1 AND provider = $2 AND event_id = $3
         LIMIT 1`,
        [companyId, provider, eventId]
      );
      await client.query("COMMIT");
      const recorded = existing.rows[0];
      if (!recorded || recorded.status !== "completed" || !recorded.result) {
        return jsonResponse({ error: "Event is already being processed" }, 409);
      }
      return jsonResponse({ ...recorded.result, duplicate: true });
    }

    await client.query(
      `UPDATE integration_connections
       SET last_sync_at = NOW(), status = 'connected'
       WHERE company_id = $1 AND provider = $2`,
      [companyId, provider]
    );

    let result: Record<string, unknown> = { success: true, event, message: "synced" };
    if (body.order && Array.isArray(body.order.items)) {
      const { rows: settings } = await client.query(
        `SELECT invoice_prefix FROM company_settings WHERE company_id = $1 LIMIT 1`,
        [companyId]
      );
      const prefix = settings[0]?.invoice_prefix || "INV";

      await client.query("SELECT pg_advisory_xact_lock($1::int, hashtext($2))", [companyId, provider]);
      const { rows: last } = await client.query(
        `SELECT invoice_number FROM invoices
         WHERE company_id = $2 AND invoice_number LIKE $1
         ORDER BY id DESC LIMIT 1`,
        [`${prefix}%`, companyId]
      );
      let nextNumber = 1;
      if (last.length > 0) {
        const parsedNumber = Number.parseInt(String(last[0].invoice_number).replace(prefix, ""), 10);
        if (Number.isFinite(parsedNumber)) nextNumber = parsedNumber + 1;
      }
      const invoiceNumber = `${prefix}${String(nextNumber).padStart(3, "0")}`;
      const items = body.order.items;
      const subtotal = items.reduce(
        (sum: number, item: { qty?: unknown; price?: unknown }) =>
          sum + Number(item.qty || 0) * Number(item.price || 0),
        0
      );
      const vat = (subtotal * 7) / 100;
      const total = subtotal + vat;
      const { rows: invoices } = await client.query(
        `INSERT INTO invoices
          (invoice_number, contact_id, net_amount, vat_amount, status, due_date, created_at, issue_date, company_id, discount_amount)
         VALUES ($1, NULL, $2, $3, 'sent', CURRENT_DATE, NOW(), CURRENT_DATE, $4, 0)
         RETURNING id`,
        [invoiceNumber, subtotal, vat, companyId]
      );
      const invoiceId = invoices[0].id;

      for (const item of items) {
        const quantity = Number(item.qty || 0);
        const unitPrice = Number(item.price || 0);
        await client.query(
          `INSERT INTO invoice_items
            (invoice_id, product_id, description, quantity, unit_price, total_price)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            invoiceId,
            item.product_id || null,
            item.description || provider,
            quantity,
            unitPrice,
            quantity * unitPrice,
          ]
        );
      }
      result = { success: true, event, invoiceId, invoiceNumber, total };
    }

    await client.query(
      `UPDATE integration_webhook_events
       SET status = 'completed', result = $4::jsonb, completed_at = NOW()
       WHERE company_id = $1 AND provider = $2 AND event_id = $3`,
      [companyId, provider, eventId, JSON.stringify(result)]
    );
    await client.query("COMMIT");
    return jsonResponse(result);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("[INTEGRATION WEBHOOK] Error:", error instanceof Error ? error.message : error);
    return jsonResponse({ error: "Webhook processing failed" }, 500);
  } finally {
    client.release();
  }
}
