import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { lineText, replyLineMessage, verifyLineSignature } from "@/lib/line";
import { notifyDiscord } from "@/lib/notify-discord";

/**
 * LINE Messaging API webhook.
 *
 * This endpoint is intentionally unauthenticated at the session layer: LINE cannot
 * present a user cookie. Authenticity is proven by the `x-line-signature` HMAC over
 * the raw body, so the raw text must be read before JSON parsing.
 *
 * The endpoint is allow-listed in proxy.ts (/api/support/line/webhook).
 */

export const dynamic = "force-dynamic";

const MAX_PAYLOAD_BYTES = 200_000;
const ACK_TEXT = "ได้รับข้อความแล้วครับ ทีมงานจะตอบกลับโดยเร็วที่สุด";
const WELCOME_TEXT = "ยินดีต้อนรับครับ ส่งข้อความที่ต้องการให้ทีมงานช่วยได้เลย";

type LineEvent = {
  type?: string;
  webhookEventId?: string;
  replyToken?: string;
  timestamp?: number;
  source?: { type?: string; userId?: string };
  message?: { id?: string; type?: string; text?: string };
  postback?: { data?: string };
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function resolveCompanyId(): Promise<number | null> {
  const { rows } = await query("SELECT id FROM companies ORDER BY id ASC LIMIT 1");
  const id = Number(rows[0]?.id);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function upsertChannel(companyId: number, destination: string): Promise<number> {
  const { rows } = await query(
    `INSERT INTO support_channels (company_id, provider, external_id, name, status)
     VALUES ($1, 'line', $2, 'LINE Official Account', 'active')
     ON CONFLICT (company_id, provider, external_id)
     DO UPDATE SET updated_at = NOW()
     RETURNING id`,
    [companyId, destination]
  );
  return Number(rows[0].id);
}

async function handleMessage(companyId: number, channelId: number, event: LineEvent) {
  const userId = event.source?.userId;
  if (!userId) return;

  const threadRes = await query(
    `INSERT INTO support_threads (company_id, channel_id, external_thread_id, status, last_message_at)
     VALUES ($1, $2, $3, 'open', NOW())
     ON CONFLICT (company_id, channel_id, external_thread_id)
     DO UPDATE SET last_message_at = NOW(), updated_at = NOW()
     RETURNING id`,
    [companyId, channelId, userId]
  );
  const threadId = Number(threadRes.rows[0].id);

  const message = event.message || {};
  const messageType = typeof message.type === "string" ? message.type : "unknown";
  const body =
    messageType === "text" && typeof message.text === "string"
      ? message.text.slice(0, 5_000)
      : `[${messageType}]`;
  const providerMessageId = typeof message.id === "string" ? message.id : null;

  await query(
    `INSERT INTO support_messages
       (company_id, thread_id, direction, provider_message_id, author_external_id, body, attachments)
     VALUES ($1, $2, 'in', $3, $4, $5, $6)
     ON CONFLICT (thread_id, provider_message_id) WHERE provider_message_id IS NOT NULL DO NOTHING`,
    [
      companyId,
      threadId,
      providerMessageId,
      userId,
      body,
      messageType === "text"
        ? null
        : JSON.stringify({ type: messageType, id: message.id ?? null }),
    ]
  );

  if (event.replyToken) {
    const result = await replyLineMessage(event.replyToken, [lineText(ACK_TEXT)]);
    if (!result.ok) {
      console.warn(`[support] LINE reply failed status=${result.status} ${result.error || ""}`);
    }
  }

  await notifyDiscord({
    title: "ข้อความใหม่จาก LINE",
    description: body.slice(0, 500),
    fields: [
      { name: "Thread", value: String(threadId), inline: true },
      { name: "ประเภท", value: messageType, inline: true },
    ],
  });
}

async function handleEvent(companyId: number, channelId: number, event: LineEvent) {
  const eventId = typeof event.webhookEventId === "string" ? event.webhookEventId : "";
  if (!eventId) return;

  const eventName = typeof event.type === "string" ? event.type : "unknown";

  const inserted = await query(
    `INSERT INTO support_events (company_id, provider, event_id, event_name)
     VALUES ($1, 'line', $2, $3)
     ON CONFLICT (company_id, provider, event_id) DO NOTHING
     RETURNING event_id`,
    [companyId, eventId, eventName]
  );
  if (inserted.rowCount === 0) return; // duplicate delivery from LINE — already handled

  try {
    if (eventName === "message") {
      await handleMessage(companyId, channelId, event);
    } else if (eventName === "follow" && event.replyToken) {
      await replyLineMessage(event.replyToken, [lineText(WELCOME_TEXT)]);
    } else if (eventName === "postback" && event.replyToken) {
      await replyLineMessage(event.replyToken, [lineText("ได้รับคำขอแล้วครับ")]);
    }

    await query(
      `UPDATE support_events SET status = 'completed', completed_at = NOW()
       WHERE company_id = $1 AND provider = 'line' AND event_id = $2`,
      [companyId, eventId]
    );
  } catch (error) {
    await query(
      `UPDATE support_events SET status = 'failed'
       WHERE company_id = $1 AND provider = 'line' AND event_id = $2`,
      [companyId, eventId]
    ).catch(() => undefined);
    console.error(
      `[support] LINE event ${eventId} failed: ${error instanceof Error ? error.message : "unknown"}`
    );
  }
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    if (rawBody.length > MAX_PAYLOAD_BYTES) return json({ error: "Payload too large" }, 413);

    if (!process.env.LINE_CHANNEL_SECRET) {
      console.error("[support] LINE_CHANNEL_SECRET is not configured");
      return json({ error: "LINE channel is not configured" }, 503);
    }

    if (!verifyLineSignature(rawBody, req.headers.get("x-line-signature"))) {
      return json({ error: "Invalid signature" }, 401);
    }

    let body: { destination?: unknown; events?: unknown };
    try {
      body = JSON.parse(rawBody);
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    const destination = typeof body.destination === "string" ? body.destination : "";
    if (!destination) return json({ error: "Missing destination" }, 400);

    const events = Array.isArray(body.events) ? (body.events as LineEvent[]) : [];
    if (events.length === 0) return json({ ok: true, processed: 0 });

    const companyId = await resolveCompanyId();
    if (!companyId) {
      console.error("[support] No company row exists; cannot store support events");
      return json({ error: "Support is not configured" }, 503);
    }

    const channelId = await upsertChannel(companyId, destination);
    for (const event of events) {
      await handleEvent(companyId, channelId, event);
    }

    return json({ ok: true, processed: events.length });
  } catch (error) {
    // Return 5xx so LINE retries (webhook redelivery) instead of silently dropping the event.
    console.error(
      `[support] LINE webhook failed: ${error instanceof Error ? error.message : "unknown"}`
    );
    return json({ error: "Internal error" }, 500);
  }
}
