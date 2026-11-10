// app/api/bridge/link/code/route.ts
// Core admin issues a one-time link code for a module (ADR-0006).
// Plaintext code is returned exactly once; only its sha256 hash is stored.
import { NextResponse } from "next/server";
import { auth, getUserCompanyId } from "@/lib/auth";
import { isAdmin, isSuperAdmin } from "@/lib/permissions";
import { query } from "@/lib/db";
import { generateLinkCode, sha256Hex, LINK_CODE_TTL_MINUTES } from "@/lib/module-link-validation.mjs";
import { assertModule, getCompanyName, ModuleLinkError } from "@/lib/module-links";

export const dynamic = "force-dynamic";

const MAX_CODES_PER_WINDOW = 10;
const WINDOW_MINUTES = 10;

function fail(code: string, message: string, status = 400) {
  return NextResponse.json({ success: false, error: message, error_code: code }, { status });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return fail("UNAUTHORIZED", "Unauthorized", 401);

  const admin = await isAdmin(session.user.id);
  if (!admin) return fail("FORBIDDEN", "Permission denied", 403);

  let body: { module?: unknown; company_id?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail("INVALID_BODY", "Invalid JSON body");
  }

  let moduleName: string;
  try {
    moduleName = assertModule(body.module);
  } catch (error) {
    const e = error as ModuleLinkError;
    return fail(e.code, e.message, e.status);
  }

  const superAdmin = await isSuperAdmin(session.user.id);
  let companyId: number;
  try {
    if (body.company_id !== undefined && body.company_id !== null && body.company_id !== "") {
      const requested = Number(body.company_id);
      if (!Number.isInteger(requested) || requested < 1) {
        return fail("INVALID_COMPANY", "company_id must be a positive integer");
      }
      const ownCompanyId = await getUserCompanyId(session.user.id);
      if (!superAdmin && requested !== ownCompanyId) {
        return fail("TENANT_MISMATCH", "company_id ไม่ตรงกับบริษัทของผู้เรียก", 403);
      }
      companyId = requested;
    } else {
      companyId = await getUserCompanyId(session.user.id);
    }
  } catch {
    return fail("COMPANY_NOT_FOUND", "ไม่พบบริษัทของผู้ใช้", 403);
  }

  const companyName = await getCompanyName(companyId);
  if (!companyName) return fail("COMPANY_NOT_FOUND", `ไม่พบบริษัท id ${companyId}`, 404);

  // Simple abuse guard: bounded number of codes per company/module/window.
  const { rows: recent } = await query(
    `SELECT COUNT(*)::int AS c FROM bridge_link_codes
     WHERE core_company_id = $1 AND module = $2
       AND created_at > NOW() - ($3 || ' minutes')::interval`,
    [companyId, moduleName, WINDOW_MINUTES]
  );
  if ((recent[0]?.c ?? 0) >= MAX_CODES_PER_WINDOW) {
    return fail("RATE_LIMITED", `ออก code เกิน ${MAX_CODES_PER_WINDOW} ครั้งใน ${WINDOW_MINUTES} นาที`, 429);
  }

  const expiresAt = new Date(Date.now() + LINK_CODE_TTL_MINUTES * 60 * 1000).toISOString();

  let code = "";
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generateLinkCode();
    try {
      await query(
        `INSERT INTO bridge_link_codes (code_hash, module, core_company_id, created_by, expires_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [sha256Hex(candidate), moduleName, companyId, Number(session.user.id) || null, expiresAt]
      );
      code = candidate;
      break;
    } catch (error) {
      const err = error as { code?: string; message?: string };
      if (err.code === "23505") continue; // hash collision, try again
      if (String(err.message || "").includes("bridge_link_codes")) {
        return fail("LINK_TABLE_MISSING", "ยังไม่ได้รัน migration add_module_links.sql", 503);
      }
      return fail("INTERNAL", err.message || "Cannot create link code", 500);
    }
  }

  if (!code) return fail("INTERNAL", "Cannot generate a unique link code", 500);

  return NextResponse.json({
    success: true,
    code,
    module: moduleName,
    company_id: companyId,
    company_name: companyName,
    expires_at: expiresAt,
  });
}
