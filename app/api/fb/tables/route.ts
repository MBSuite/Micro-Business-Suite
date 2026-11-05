// app/api/fb/tables/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth, getUserCompanyId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = await getUserCompanyId(session.user.id);
  const { rows } = await query(`SELECT * FROM fb_tables WHERE company_id = $1 ORDER BY code`, [companyId]);
  return NextResponse.json({ success: true, data: rows });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = await getUserCompanyId(session.user.id);
  const b = await req.json();
  const { rows } = await query(
    `INSERT INTO fb_tables (company_id, code, name, seats, zone, pos_x, pos_y) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [companyId, b.code, b.name || b.code, Number(b.seats || 2), b.zone || null, Number(b.pos_x || 0), Number(b.pos_y || 0)]
  );
  return NextResponse.json({ success: true, data: rows[0] });
}
