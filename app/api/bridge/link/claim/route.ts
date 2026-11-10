// app/api/bridge/link/claim/route.ts
// A module claims a link code on behalf of a shop (ADR-0006).
// Requires the shared Bridge service token, never a browser session.
import { NextResponse } from "next/server";
import { hasBridgeServiceToken } from "@/lib/bridge-auth.mjs";
import { normalizeLinkCode, sha256Hex } from "@/lib/module-link-validation.mjs";
import { assertModule, assertShopCode, claimLinkCode, ModuleLinkError } from "@/lib/module-links";

export const dynamic = "force-dynamic";

function fail(code: string, message: string, status = 400) {
  return NextResponse.json({ success: false, error: message, error_code: code }, { status });
}

export async function POST(req: Request) {
  const configuredToken = process.env.MBS_BRIDGE_TOKEN || "";
  if (!hasBridgeServiceToken(req, configuredToken)) {
    return fail("UNAUTHORIZED", "Unauthorized", 401);
  }

  let body: {
    code?: unknown;
    module?: unknown;
    shop_code?: unknown;
    shop_name?: unknown;
    owner_email?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return fail("INVALID_BODY", "Invalid JSON body");
  }

  const code = normalizeLinkCode(body.code);
  if (!code) return fail("LINK_CODE_INVALID", "link code ไม่ถูกต้องหรือไม่พบ", 400);

  let moduleName: string;
  let shopCode: string;
  try {
    moduleName = assertModule(body.module);
    shopCode = assertShopCode(body.shop_code);
  } catch (error) {
    const e = error as ModuleLinkError;
    return fail(e.code, e.message, e.status);
  }

  const shopName = typeof body.shop_name === "string" ? body.shop_name.trim() : "";
  if (!shopName || shopName.length > 200) {
    return fail("INVALID_SHOP_NAME", "shop_name ต้องยาว 1-200 ตัวอักษร");
  }

  let ownerEmail: string | null = null;
  if (body.owner_email !== undefined && body.owner_email !== null && body.owner_email !== "") {
    if (typeof body.owner_email !== "string" || body.owner_email.length > 254 || !body.owner_email.includes("@")) {
      return fail("INVALID_OWNER_EMAIL", "owner_email ไม่ถูกต้อง");
    }
    ownerEmail = body.owner_email.trim();
  }

  try {
    const result = await claimLinkCode({
      codeHash: sha256Hex(code),
      module: moduleName,
      shopCode,
      shopName,
      ownerEmail,
    });
    return NextResponse.json({
      success: true,
      company_id: result.companyId,
      company_name: result.companyName,
      module: moduleName,
      shop_code: shopCode,
      linked_at: result.linkedAt,
      idempotent: result.idempotent,
    });
  } catch (error) {
    if (error instanceof ModuleLinkError) return fail(error.code, error.message, error.status);
    const e = error as { code?: string; message?: string };
    if (e.code === "23505") {
      return fail("LINK_ALREADY_ACTIVE", "ร้านนี้หรือบริษัทนี้เชื่อมอยู่แล้วในโมดูลนี้", 409);
    }
    if (String(e.message || "").includes("module_links") || String(e.message || "").includes("bridge_link_codes")) {
      return fail("LINK_TABLE_MISSING", "ยังไม่ได้รัน migration add_module_links.sql", 503);
    }
    return fail("INTERNAL", e.message || "Claim failed", 500);
  }
}
