import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireSupportActor } from "@/lib/support-auth";
import {
  isThreadPriority,
  isThreadStatus,
  maskExternalId,
} from "@/lib/support-outbound";

/**
 * GET   /api/support/threads/[id]  -> thread + messages (oldest first)
 * PATCH /api/support/threads/[id]  -> status / priority / assignee
 *
 * Both handlers scope by the caller's company_id, so a thread id from another
 * tenant resolves to 404 rather than leaking existence.
 */

export const dynamic = "force-dynamic";

const MESSAGE_PAGE_SIZE = 200;

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireSupportActor("read");
  if ("error" in gate) return gate.error;
  const { companyId } = gate.actor;

  const { id: rawId } = await params;
  const threadId = parseId(rawId);
  if (!threadId) return NextResponse.json({ error: "Invalid thread id" }, { status: 400 });

  try {
    const threadRes = await query(
      `SELECT t.id, t.channel_id, t.external_thread_id, t.subject, t.status, t.priority,
              t.assignee_user_id, t.last_message_at, t.created_at, t.updated_at,
              c.provider, c.name AS channel_name
       FROM support_threads t
       JOIN support_channels c ON c.id = t.channel_id
       WHERE t.id = $1 AND t.company_id = $2
       LIMIT 1`,
      [threadId, companyId]
    );

    const thread = threadRes.rows[0];
    if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

    const messagesRes = await query(
      `SELECT id, direction, author_user_id, body, delivery_status, created_at
       FROM support_messages
       WHERE thread_id = $1 AND company_id = $2
       ORDER BY id ASC
       LIMIT $3`,
      [threadId, companyId, MESSAGE_PAGE_SIZE]
    );

    return NextResponse.json({
      success: true,
      data: {
        thread: {
          id: Number(thread.id),
          channel_id: Number(thread.channel_id),
          provider: thread.provider,
          channel_name: thread.channel_name,
          external_thread_id_hint: maskExternalId(thread.external_thread_id),
          subject: thread.subject,
          status: thread.status,
          priority: thread.priority,
          assignee_user_id:
            thread.assignee_user_id == null ? null : Number(thread.assignee_user_id),
          last_message_at: thread.last_message_at,
          created_at: thread.created_at,
          updated_at: thread.updated_at,
        },
        messages: messagesRes.rows.map((row) => ({
          id: Number(row.id),
          direction: row.direction,
          author_user_id: row.author_user_id == null ? null : Number(row.author_user_id),
          body: row.body,
          delivery_status: row.delivery_status,
          created_at: row.created_at,
        })),
        message_page_size: MESSAGE_PAGE_SIZE,
      },
    });
  } catch (error) {
    console.error(
      `[support] thread detail failed: ${error instanceof Error ? error.message : "unknown"}`
    );
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireSupportActor("update");
  if ("error" in gate) return gate.error;
  const { companyId } = gate.actor;

  const { id: rawId } = await params;
  const threadId = parseId(rawId);
  if (!threadId) return NextResponse.json({ error: "Invalid thread id" }, { status: 400 });

  let body: { status?: unknown; priority?: unknown; assignee_user_id?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sets: string[] = [];
  const values: unknown[] = [];

  if (body.status !== undefined) {
    if (!isThreadStatus(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    values.push(body.status);
    sets.push(`status = $${values.length}`);
  }

  if (body.priority !== undefined) {
    if (!isThreadPriority(body.priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }
    values.push(body.priority);
    sets.push(`priority = $${values.length}`);
  }

  if (body.assignee_user_id !== undefined) {
    if (body.assignee_user_id === null) {
      sets.push("assignee_user_id = NULL");
    } else {
      const assignee = Number(body.assignee_user_id);
      if (!Number.isSafeInteger(assignee) || assignee <= 0) {
        return NextResponse.json({ error: "Invalid assignee_user_id" }, { status: 400 });
      }
      values.push(assignee);
      sets.push(`assignee_user_id = $${values.length}`);
    }
  }

  if (sets.length === 0) {
    return NextResponse.json({ error: "No supported fields to update" }, { status: 400 });
  }

  values.push(threadId, companyId);
  const threadParam = values.length - 1;
  const companyParam = values.length;

  try {
    const { rows } = await query(
      `UPDATE support_threads
       SET ${sets.join(", ")}, updated_at = NOW()
       WHERE id = $${threadParam} AND company_id = $${companyParam}
       RETURNING id, status, priority, assignee_user_id, updated_at`,
      values
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error(
      `[support] thread update failed: ${error instanceof Error ? error.message : "unknown"}`
    );
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
