import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { lineText, pushLineMessage } from "@/lib/line";
import { requireSupportActor } from "@/lib/support-auth";
import { normalizeOutboundText, supportsOutbound } from "@/lib/support-outbound";

/**
 * POST /api/support/threads/[id]/messages  { "text": "..." }
 *
 * Stores the agent reply first, then attempts delivery through the provider.
 * A delivery failure does not delete the message: it is kept with
 * delivery_status = 'failed' so the inbox shows the truth instead of pretending
 * the customer received it. The response is 200 with `delivered: false`.
 *
 * Only LINE supports outbound today; Discord is notification-only (incoming
 * webhook) and would need a bot to reply, so other providers return 400.
 */

export const dynamic = "force-dynamic";

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function clipError(value: string | undefined): string | null {
  if (!value) return null;
  return value.slice(0, 300);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireSupportActor("create");
  if ("error" in gate) return gate.error;
  const { companyId, userId } = gate.actor;

  const { id: rawId } = await params;
  const threadId = parseId(rawId);
  if (!threadId) return NextResponse.json({ error: "Invalid thread id" }, { status: 400 });

  let body: { text?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const normalized = normalizeOutboundText(body.text);
  if (!normalized.ok) {
    return NextResponse.json({ error: `Invalid text: ${normalized.reason}` }, { status: 400 });
  }

  try {
    const threadRes = await query(
      `SELECT t.id, t.external_thread_id, c.provider
       FROM support_threads t
       JOIN support_channels c ON c.id = t.channel_id
       WHERE t.id = $1 AND t.company_id = $2
       LIMIT 1`,
      [threadId, companyId]
    );
    const thread = threadRes.rows[0];
    if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

    if (!supportsOutbound(String(thread.provider))) {
      return NextResponse.json(
        { error: `Outbound messages are not supported for provider ${thread.provider}` },
        { status: 400 }
      );
    }

    const inserted = await query(
      `INSERT INTO support_messages
         (company_id, thread_id, direction, author_user_id, body, delivery_status)
       VALUES ($1, $2, 'out', $3, $4, 'pending')
       RETURNING id`,
      [companyId, threadId, Number(userId), normalized.text]
    );
    const messageId = Number(inserted.rows[0].id);

    const result = await pushLineMessage(String(thread.external_thread_id), [
      lineText(normalized.text),
    ]);

    const deliveryStatus = result.ok ? "sent" : "failed";
    await query(
      `UPDATE support_messages
       SET delivery_status = $1, delivery_error = $2
       WHERE id = $3 AND company_id = $4`,
      [deliveryStatus, result.ok ? null : clipError(result.error), messageId, companyId]
    );
    await query(
      `UPDATE support_threads SET last_message_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND company_id = $2`,
      [threadId, companyId]
    );

    if (!result.ok) {
      console.warn(
        `[support] LINE push failed for thread ${threadId}: status=${result.status}`
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        message_id: messageId,
        delivered: result.ok,
        delivery_status: deliveryStatus,
        provider_status: result.status,
      },
    });
  } catch (error) {
    console.error(
      `[support] outbound message failed: ${error instanceof Error ? error.message : "unknown"}`
    );
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
