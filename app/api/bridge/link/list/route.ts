// app/api/bridge/link/list/route.ts
// Lists module links that belong to the caller's company (ADR-0006).
// Session + admin only; a superadmin may list every company with ?all=1.
import { NextResponse } from "next/server";
import { auth, getUserCompanyId } from "@/lib/auth";
import { isAdmin, isSuperAdmin } from "@/lib/permissions";
import { query } from "@/lib/db";
import { toIso } from "@/lib/module-link-validation.mjs";

export const dynamic = "force-dynamic";

type LinkRow = {
  module: string;
  shop_code: string;
  shop_name: string;
  owner_email: string | null;
  core_company_id: number;
  status: string;
  linked_at: string | Date;
  revoked_at: string | Date | null;
};

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isAdmin(session.user.id))) {
    return NextResponse.json({ success: false, error: "Permission denied" }, { status: 403 });
  }

  const url = new URL(req.url);
  const all = url.searchParams.get("all") === "1";
  const includeRevoked = url.searchParams.get("include_revoked") === "1";
  const moduleFilter = url.searchParams.get("module");

  const superAdmin = await isSuperAdmin(session.user.id);
  const scopeAll = all && superAdmin;
  const companyId = scopeAll ? null : await getUserCompanyId(session.user.id);

  const where: string[] = [];
  const params: unknown[] = [];
  if (companyId != null) {
    params.push(companyId);
    where.push(`ml.core_company_id = $${params.length}`);
  }
  if (!includeRevoked) where.push(`ml.status = 'active'`);
  if (moduleFilter) {
    params.push(moduleFilter);
    where.push(`ml.module = $${params.length}`);
  }

  const { rows } = await query(
    `SELECT ml.module, ml.shop_code, ml.shop_name, ml.owner_email, ml.core_company_id,
            ml.status, ml.linked_at, ml.revoked_at, c.name AS company_name
     FROM module_links ml
     LEFT JOIN companies c ON c.id = ml.core_company_id
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY (ml.status = 'active') DESC, ml.linked_at DESC
     LIMIT 200`,
    params
  );

  return NextResponse.json({
    success: true,
    all: scopeAll,
    links: (rows as (LinkRow & { company_name: string | null })[]).map((row) => ({
      module: row.module,
      shop_code: row.shop_code,
      shop_name: row.shop_name,
      owner_email: row.owner_email,
      company_id: Number(row.core_company_id),
      company_name: row.company_name,
      status: row.status,
      linked_at: toIso(row.linked_at),
      revoked_at: toIso(row.revoked_at),
    })),
  });
}
