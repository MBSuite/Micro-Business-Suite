// app/api/promotions/[id]/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth, getUserCompanyId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = await getUserCompanyId(session.user.id);
  const { rows } = await query(`SELECT * FROM promotions WHERE id = $1 AND company_id = $2`, [id, companyId]);
  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: rows[0] });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = await getUserCompanyId(session.user.id);
  const b = await req.json();
  const { rows } = await query(
    `UPDATE promotions SET code=$1, name=$2, description=$3, promo_type=$4, value=$5, min_purchase=$6, max_discount=$7,
      applies_to=$8, applies_ids=$9, starts_at=$10, ends_at=$11, usage_limit=$12, is_active=$13, updated_at=NOW()
     WHERE id=$14 AND company_id=$15 RETURNING *`,
    [
      b.code || null, b.name, b.description || null, b.promo_type || "percentage",
      Number(b.value || 0), Number(b.min_purchase || 0), b.max_discount ? Number(b.max_discount) : null,
      b.applies_to || "all", b.applies_ids || null, b.starts_at || null, b.ends_at || null,
      b.usage_limit ? Number(b.usage_limit) : null, b.is_active !== false, id, companyId,
    ]
  );
  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: rows[0] });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = await getUserCompanyId(session.user.id);
  await query(`DELETE FROM promotions WHERE id = $1 AND company_id = $2`, [id, companyId]);
  return NextResponse.json({ success: true });
}
