/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { auth, getUserCompanyId } from "@/lib/auth";
import { isAdmin, isSuperAdmin } from "@/lib/permissions";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const admin = await isAdmin(session.user.id);
    if (!admin) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const event = url.searchParams.get("event");
    const all = url.searchParams.get("all") === "1";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10) || 50, 200);
    const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10) || 0, 0);

    const superAdmin = await isSuperAdmin(session.user.id);
    const companyId = await getUserCompanyId(session.user.id);

    const where: string[] = [];
    const params: any[] = [];
    let i = 1;

    if (!(all && superAdmin)) {
      where.push(`company_id = $${i++}`);
      params.push(companyId);
    }
    if (status) {
      where.push(`status = $${i++}`);
      params.push(status);
    }
    if (event) {
      where.push(`event = $${i++}`);
      params.push(event);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const { rows: countRows } = await query(
      `SELECT COUNT(*)::int AS c FROM bridge_sync_log ${whereSql}`,
      params
    );
    const total = countRows[0]?.c || 0;

    const { rows } = await query(
      `SELECT id, idempotency_key, event, company_id, status, result, error, created_at, updated_at
       FROM bridge_sync_log
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT $${i++} OFFSET $${i++}`,
      [...params, limit, offset]
    );

    // distinct values for filters
    const { rows: evRows } = await query(
      `SELECT DISTINCT event FROM bridge_sync_log ${where.length ? whereSql : ""} ORDER BY event`,
      params
    );
    const { rows: stRows } = await query(
      `SELECT DISTINCT status FROM bridge_sync_log ${where.length ? whereSql : ""} ORDER BY status`,
      params
    );

    return NextResponse.json({
      companyId,
      isSuperAdmin: superAdmin,
      total,
      limit,
      offset,
      logs: rows,
      filters: {
        events: evRows.map((r: any) => r.event),
        statuses: stRows.map((r: any) => r.status),
      },
    });
  } catch (error: any) {
    if (String(error?.message || "").includes("bridge_sync_log")) {
      return NextResponse.json(
        { error: "bridge_sync_log table missing. Run migration add_bridge_sync_log.sql first." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: error?.message || "Failed to fetch bridge sync log" }, { status: 500 });
  }
}
