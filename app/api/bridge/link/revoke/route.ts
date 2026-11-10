// app/api/bridge/link/revoke/route.ts
// Revokes an active module <-> Core company link (ADR-0006).
// Allowed for the shared Bridge service token or a Core admin session.
import { NextResponse } from "next/server";
import { auth, getUserCompanyId } from "@/lib/auth";
import { isAdmin, isSuperAdmin } from "@/lib/permissions";
import { hasBridgeServiceToken } from "@/lib/bridge-auth.mjs";
import { revokeLink, assertModule, assertShopCode, ModuleLinkError } from "@/lib/module-links";

export const dynamic = "force-dynamic";

function fail(code: string, message: string, status = 400) {
  return NextResponse.json({ success: false, error: message, error_code: code }, { status });
}

export async function POST(req: Request) {
  const configuredToken = process.env.MBS_BRIDGE_TOKEN || "";
  const isService = hasBridgeServiceToken(req, configuredToken);

  // Core-side caller (admin UI). Company scope is enforced below.
  let sessionCompanyId: number | null = null;
  let superAdmin = false;
  if (!isService) {
    const session = await auth();
    if (!session?.user?.id) return fail("UNAUTHORIZED", "Unauthorized", 401);
    if (!(await isAdmin(session.user.id))) return fail("FORBIDDEN", "Permission denied", 403);
    superAdmin = await isSuperAdmin(session.user.id);
    if (!superAdmin) sessionCompanyId = await getUserCompanyId(session.user.id);
  }

  let body: { module?: unknown; shop_code?: unknown; reason?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail("INVALID_BODY", "Invalid JSON body");
  }

  let moduleName: string;
  let shopCode: string;
  try {
    moduleName = assertModule(body.module);
    shopCode = assertShopCode(body.shop_code);
  } catch (error) {
    const e = error as ModuleLinkError;
    return fail(e.code, e.message, e.status);
  }

  const reason =
    typeof body.reason === "string" && body.reason.trim()
      ? body.reason.trim().slice(0, 500)
      : isService
        ? "revoked by module"
        : "revoked by Core admin";

  try {
    const row = await revokeLink({
      module: moduleName,
      shopCode,
      reason,
      coreCompanyId: superAdmin ? null : sessionCompanyId,
    });
    return NextResponse.json({
      success: true,
      module: row.module,
      shop_code: row.shop_code,
      revoked_at: new Date(row.revoked_at as string).toISOString(),
    });
  } catch (error) {
    if (error instanceof ModuleLinkError) return fail(error.code, error.message, error.status);
    const e = error as { message?: string };
    if (String(e.message || "").includes("module_links")) {
      return fail("LINK_TABLE_MISSING", "ยังไม่ได้รัน migration add_module_links.sql", 503);
    }
    return fail("INTERNAL", e.message || "Revoke failed", 500);
  }
}
