/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
// app/api/integrations/connections/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth, getUserCompanyId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = await getUserCompanyId(session.user.id);
  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  let q = `SELECT id, company_id, provider, category, name, settings, status, last_sync_at, is_active, created_at FROM integration_connections WHERE company_id = $1`;
  const params: any[] = [companyId];
  if (category) { params.push(category); q += ` AND category = $${params.length}`; }
  q += ` ORDER BY created_at DESC`;
  const { rows } = await query(q, params);
  return NextResponse.json({ success: true, data: rows });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = await getUserCompanyId(session.user.id);
  const b = await req.json();
  const { rows } = await query(
    `INSERT INTO integration_connections (company_id, provider, category, name, credentials, settings, status)
     VALUES ($1,$2,$3,$4,$5,$6,'connected') RETURNING id, company_id, provider, category, name, settings, status, created_at`,
    [companyId, b.provider, b.category, b.name || b.provider, b.credentials ? JSON.stringify(b.credentials) : null, b.settings ? JSON.stringify(b.settings) : null]
  );
  return NextResponse.json({ success: true, data: rows[0] });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = await getUserCompanyId(session.user.id);
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  await query(`DELETE FROM integration_connections WHERE id = $1 AND company_id = $2`, [id, companyId]);
  return NextResponse.json({ success: true });
}
