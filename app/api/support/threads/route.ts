import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireSupportActor } from "@/lib/support-auth";
import { isThreadStatus, maskExternalId } from "@/lib/support-outbound";

/**
 * GET /api/support/threads?status=open&limit=50
 *
 * Returns the support inbox for the caller's company. Threads are ordered by the
 * most recent activity and include a message count plus the latest message body.
 * `external_thread_id` is masked: the admin UI only needs a hint, not the raw
 * provider identifier.
 */

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export async function GET(req: Request) {
  const gate = await requireSupportActor("read");
  if ("error" in gate) return gate.error;
  const { companyId } = gate.actor;

  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status");
  if (statusParam && !isThreadStatus(statusParam)) {
    return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
  }

  const limitParam = Number(url.searchParams.get("limit") ?? DEFAULT_LIMIT);
  const limit = Number.isSafeInteger(limitParam)
    ? Math.min(Math.max(limitParam, 1), MAX_LIMIT)
    : DEFAULT_LIMIT;

  try {
    const { rows } = await query(
      `SELECT
         t.id,
         t.channel_id,
         t.external_thread_id,
         t.subject,
         t.status,
         t.priority,
         t.assignee_user_id,
         t.last_message_at,
         t.created_at,
         c.provider,
         c.name AS channel_name,
         (SELECT COUNT(*) FROM support_messages m WHERE m.thread_id = t.id)::int AS message_count,
         (SELECT m.body FROM support_messages m WHERE m.thread_id = t.id ORDER BY m.id DESC LIMIT 1) AS last_message
       FROM support_threads t
       JOIN support_channels c ON c.id = t.channel_id
       WHERE t.company_id = $1
         AND ($2::text IS NULL OR t.status = $2)
       ORDER BY COALESCE(t.last_message_at, t.created_at) DESC
       LIMIT $3`,
      [companyId, statusParam || null, limit]
    );

    return NextResponse.json({
      success: true,
      data: rows.map((row) => ({
        id: Number(row.id),
        channel_id: Number(row.channel_id),
        provider: row.provider,
        channel_name: row.channel_name,
        external_thread_id_hint: maskExternalId(row.external_thread_id),
        subject: row.subject,
        status: row.status,
        priority: row.priority,
        assignee_user_id: row.assignee_user_id == null ? null : Number(row.assignee_user_id),
        message_count: Number(row.message_count ?? 0),
        last_message: row.last_message,
        last_message_at: row.last_message_at,
        created_at: row.created_at,
      })),
    });
  } catch (error) {
    console.error(
      `[support] list threads failed: ${error instanceof Error ? error.message : "unknown"}`
    );
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
