// app/api/branches/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth, getUserCompanyId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = await getUserCompanyId(session.user.id);
  const { rows } = await query(`SELECT * FROM branches WHERE company_id = $1 ORDER BY is_main DESC, name`, [companyId]);
  return NextResponse.json({ success: true, data: rows });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = await getUserCompanyId(session.user.id);
  const b = await req.json();
  if (!b.code || !b.name) return NextResponse.json({ error: "code and name required" }, { status: 400 });
  const { rows } = await query(
    `INSERT INTO branches (company_id, code, name, address, phone, is_main, is_active) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [companyId, b.code, b.name, b.address || null, b.phone || null, !!b.is_main, b.is_active !== false]
  );
  return NextResponse.json({ success: true, data: rows[0] });
}
