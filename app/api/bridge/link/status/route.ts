// app/api/bridge/link/status/route.ts
// Read-only link status for a module shop (ADR-0006).
// Service-token only: a shop code is not a secret, so browser sessions are not
// allowed to enumerate links across tenants.
import { NextResponse } from "next/server";
import { hasBridgeServiceToken } from "@/lib/bridge-auth.mjs";
import { toIso } from "@/lib/module-link-validation.mjs";
import {
  assertModule,
  assertShopCode,
  findLatestLink,
  getCompanyName,
  ModuleLinkError,
} from "@/lib/module-links";

export const dynamic = "force-dynamic";

function fail(code: string, message: string, status = 400) {
  return NextResponse.json({ success: false, error: message, error_code: code }, { status });
}

export async function GET(req: Request) {
  const configuredToken = process.env.MBS_BRIDGE_TOKEN || "";
  if (!hasBridgeServiceToken(req, configuredToken)) {
    return fail("UNAUTHORIZED", "Unauthorized", 401);
  }

  const url = new URL(req.url);
  let moduleName: string;
  let shopCode: string;
  try {
    moduleName = assertModule(url.searchParams.get("module"));
    shopCode = assertShopCode(url.searchParams.get("shop_code"));
  } catch (error) {
    const e = error as ModuleLinkError;
    return fail(e.code, e.message, e.status);
  }

  try {
    const row = await findLatestLink(moduleName, shopCode);
    const linked = Boolean(row && row.status === "active");
    if (linked) {
      const companyName = await getCompanyName(Number(row!.core_company_id));
      return NextResponse.json({
        success: true,
        linked: true,
        module: moduleName,
        shop_code: shopCode,
        company_id: Number(row!.core_company_id),
        company_name: companyName,
        linked_at: toIso(row!.linked_at),
      });
    }

    return NextResponse.json({
      success: true,
      linked: false,
      module: moduleName,
      shop_code: shopCode,
      revoked_at: row ? toIso(row.revoked_at) : null,
    });
  } catch (error) {
    const e = error as { message?: string };
    if (String(e.message || "").includes("module_links")) {
      return fail("LINK_TABLE_MISSING", "ยังไม่ได้รัน migration add_module_links.sql", 503);
    }
    return fail("INTERNAL", e.message || "Status check failed", 500);
  }
}
