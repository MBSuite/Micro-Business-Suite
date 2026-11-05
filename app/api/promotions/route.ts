// app/api/promotions/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth, getUserCompanyId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = await getUserCompanyId(session.user.id);
  const { rows } = await query(`SELECT * FROM promotions WHERE company_id = $1 ORDER BY created_at DESC`, [companyId]);
  return NextResponse.json({ success: true, data: rows });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = await getUserCompanyId(session.user.id);
  const b = await req.json();
  if (!b.name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const { rows } = await query(
    `INSERT INTO promotions (company_id, code, name, description, promo_type, value, min_purchase, max_discount, applies_to, applies_ids, starts_at, ends_at, usage_limit, is_active, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
    [
      companyId,
      b.code || null,
      b.name,
      b.description || null,
      b.promo_type || "percentage",
      Number(b.value || 0),
      Number(b.min_purchase || 0),
      b.max_discount ? Number(b.max_discount) : null,
      b.applies_to || "all",
      b.applies_ids || null,
      b.starts_at || null,
      b.ends_at || null,
      b.usage_limit ? Number(b.usage_limit) : null,
      b.is_active !== false,
      Number(session.user.id),
    ]
  );
  return NextResponse.json({ success: true, data: rows[0] });
}
