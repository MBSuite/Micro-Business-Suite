/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/bridge/admin-license/route.ts
// Bridge เฉพาะงาน Admin License: micro-admin -> Core
//   N1 (LICENSE_STANDARD): license logic อยู่ที่ Core เท่านั้น — เรียกใช้ lib/license.ts / lib/license-packages.ts
//   N7 (LICENSE_STANDARD): service-to-service ด้วย token เฉพาะงาน (MBS_ADMIN_LICENSE_TOKEN)
//                          ห้ามใช้ MBS_BRIDGE_TOKEN ซ้ำ และห้าม cross-database จาก micro-admin
//   dry_run=true ใช้สำหรับทดสอบ integration โดยไม่เขียน DB (ยังต้องมี token เช่นเดิม)
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { hasBridgeServiceToken } from "@/lib/bridge-auth.mjs";
import {
  createLicenseKey,
  getSigningSalt,
  verifyLicenseKey,
  type LicensePayload,
} from "@/lib/license";
import { LICENSE_TIERS, KNOWN_FEATURES, getLicensePackage } from "@/lib/license-packages";

export const dynamic = "force-dynamic";

const ACTIONS = ["ISSUE", "RENEW", "REVOKE", "VERIFY"] as const;
type Action = (typeof ACTIONS)[number];

const bad = (message: string, status = 400, extra?: Record<string, unknown>) =>
  NextResponse.json({ success: false, error: message, ...extra }, { status });

function errorMessage(error: any): string {
  return error instanceof Error ? error.message : String(error);
}

function positiveInt(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

function isDateOnly(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(new Date(value).getTime())
  );
}

type Built = {
  ok: true;
  payload: LicensePayload;
  tier: string;
  maxUsers: number;
  maxTx: number;
  features: string[];
  expiresAt: string | null;
};

function buildLicense(body: any, company: any, action: Action): Built | { ok: false; error: string } {
  const mode = String(body?.mode ?? "subscription").toLowerCase();
  if (mode !== "perpetual" && mode !== "subscription") {
    return { ok: false, error: "mode ต้องเป็น perpetual หรือ subscription" };
  }

  const tier = String(body?.license_type ?? company?.plan_type ?? "PROFESSIONAL").toUpperCase();
  if (!(LICENSE_TIERS as readonly string[]).includes(tier)) {
    return { ok: false, error: `license_type ต้องเป็น ${LICENSE_TIERS.join(" / ")}` };
  }
  if (mode === "subscription" && tier === "TRIAL" && action === "ISSUE") {
    return { ok: false, error: "TRIAL เป็นสถานะสมัครเอง ไม่ต้องออก key — เลือก STANDARD ขึ้นไป" };
  }

  const expires = body?.expires ? String(body.expires).trim() : "";
  if (mode === "subscription" && !isDateOnly(expires)) {
    return { ok: false, error: "subscription ต้องระบุ expires ในรูปแบบ YYYY-MM-DD" };
  }

  const pkg = getLicensePackage(tier);
  const maxUsers =
    positiveInt(body?.max_users ?? company?.max_users) ?? pkg.defaultMaxUsers;
  const maxTx =
    positiveInt(body?.max_transactions ?? body?.max_transactions_per_month) ??
    pkg.defaultMaxTransactionsPerMonth;

  let features: string[] = [...pkg.defaultFeatures];
  if (Array.isArray(body?.features) && body.features.length > 0) {
    const filtered: string[] = [];
    for (const raw of body.features as unknown[]) {
      const feature = String(raw).trim();
      if (
        feature &&
        (KNOWN_FEATURES as readonly string[]).includes(feature) &&
        !filtered.includes(feature)
      ) {
        filtered.push(feature);
      }
    }
    if (filtered.length > 0) features = filtered;
  }

  const payload: LicensePayload = {
    product: "micro-business-suite",
    mode: mode as LicensePayload["mode"],
    license_type: tier as LicensePayload["license_type"],
    licensee:
      String(body?.licensee ?? company?.customer_name ?? company?.customer_email ?? "customer").trim() ||
      "customer",
    company: String(company?.name ?? "Your Company"),
    issued_at: new Date().toISOString(),
    ...(mode === "subscription" ? { expires_at: `${expires}T23:59:59.999Z` } : {}),
    max_users: maxUsers,
    max_transactions_per_month: maxTx,
    allowed_features: features,
    ...(tier === "AUDIT" ? { is_audit: true } : {}),
  };

  return {
    ok: true,
    payload,
    tier,
    maxUsers,
    maxTx,
    features,
    expiresAt: mode === "subscription" ? payload.expires_at! : null,
  };
}

/**
 * POST /api/bridge/admin-license
 * body: { action: ISSUE|RENEW|REVOKE|VERIFY, companyId?, key?, mode?, license_type?,
 *         expires?, licensee?, max_users?, max_transactions?, features?, notes?,
 *         price_amount?, price_currency?, created_by?, dry_run? }
 */
export async function POST(request: Request) {
  const configuredToken = process.env.MBS_ADMIN_LICENSE_TOKEN || "";
  if (!configuredToken) {
    return bad("ADMIN_LICENSE_BRIDGE_NOT_CONFIGURED: MBS_ADMIN_LICENSE_TOKEN is not set", 503);
  }
  if (!hasBridgeServiceToken(request, configuredToken)) return bad("Unauthorized", 401);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return bad("Invalid JSON");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return bad("Invalid body");

  const action = String(body.action ?? "").toUpperCase() as Action;
  if (!(ACTIONS as readonly string[]).includes(action)) {
    return bad(`action ต้องเป็น ${ACTIONS.join(" / ")}`);
  }

  try {
    // VERIFY — อ่านอย่างเดียว ใช้ LICENSE_SALT ใน Core (ห้าม copy algorithm ไป micro-admin)
    if (action === "VERIFY") {
      const key = String(body.key ?? "").trim();
      if (!key.startsWith("MBS.")) return bad("key ต้องเป็น license key ที่ขึ้นต้นด้วย MBS.");
      const result = verifyLicenseKey(key, getSigningSalt());
      return NextResponse.json({
        success: true,
        action,
        valid: result.valid,
        error: result.error ?? null,
        payload: result.payload ?? null,
      });
    }

    const companyId = positiveInt(body.companyId);
    if (!companyId) return bad("companyId ต้องเป็นเลขบวก");

    const companyRes = await query("SELECT * FROM companies WHERE id = $1 LIMIT 1", [companyId]);
    const company = companyRes.rows[0];
    if (!company) return bad("ไม่พบลูกค้า", 404);

    const dryRun = body.dry_run === true;
    const notes = typeof body.notes === "string" ? body.notes.slice(0, 2000) : "";
    const actor = positiveInt(body.created_by);
    const priceAmount = Number.parseFloat(
      String(body.price_amount ?? company.price_amount ?? "0")
    ) || 0;
    const priceCurrency = String(body.price_currency ?? company.price_currency ?? "THB").slice(0, 10);

    // REVOKE — standard เดิมไม่มี semantics: กำหนดเป็นล้าง key + ตั้งสถานะ Revoked
    // (offline key ที่เซ็นไว้แล้วไม่สามารถเพิกถอนได้จากระยะไกล → ต้องพึ่ง online status)
    if (action === "REVOKE") {
      const oldKey = company.license_key == null ? null : String(company.license_key);
      if (!dryRun) {
        await query(
          `UPDATE companies SET license_key = NULL, subscription_status = 'Revoked',
             expiry_date = CURRENT_DATE, updated_at = NOW()
           WHERE id = $1`,
          [companyId]
        );
        await query(
          `INSERT INTO subscription_events
             (company_id, action, license_type, license_key, expires_at, max_users, notes, payload, created_by)
           VALUES ($1, 'REVOKE', $2, $3, $4, $5, $6, $7, $8)`,
          [
            companyId,
            company.plan_type ?? null,
            oldKey,
            company.expiry_date ?? null,
            company.max_users ?? null,
            notes || "ระงับ license ผ่าน micro-admin",
            JSON.stringify({
              previous_status: company.subscription_status ?? null,
              revoked_via: "admin-license-bridge",
            }),
            actor,
          ]
        );
      }
      return NextResponse.json({
        success: true,
        action,
        companyId,
        dry_run: dryRun,
        previous_license_key: oldKey,
      });
    }

    const built = buildLicense(body, company, action);
    if (!built.ok) return bad(built.error);

    const licenseKey = createLicenseKey(built.payload, getSigningSalt());

    if (!dryRun) {
      await query(
        `UPDATE companies SET
           license_key = $1, plan_type = $2, max_users = $3,
           subscription_status = 'Active', expiry_date = $4, trial_end = NULL,
           last_renewed_at = NOW(), price_amount = $5, price_currency = $6,
           is_audit = $7, updated_at = NOW()
         WHERE id = $8`,
        [
          licenseKey,
          built.tier,
          built.maxUsers,
          built.expiresAt,
          priceAmount,
          priceCurrency,
          built.tier === "AUDIT",
          companyId,
        ]
      );
      await query(
        `INSERT INTO subscription_events
           (company_id, action, license_type, license_key, expires_at, max_users,
            amount, notes, payload, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          companyId,
          action,
          built.tier,
          licenseKey,
          built.expiresAt,
          built.maxUsers,
          priceAmount || null,
          notes || (action === "RENEW" ? "ต่ออายุผ่าน micro-admin" : "ออก license ผ่าน micro-admin"),
          JSON.stringify({
            mode: built.payload.mode,
            max_transactions_per_month: built.maxTx,
            features: built.features,
            issued_via: "admin-license-bridge",
          }),
          actor,
        ]
      );
    }

    return NextResponse.json({
      success: true,
      action,
      companyId,
      license_key: licenseKey,
      payload: built.payload,
      dry_run: dryRun,
    });
  } catch (error) {
    // อย่า log payload/token/salt — log เฉพาะข้อความ error
    console.error("POST /api/bridge/admin-license error:", errorMessage(error));
    return bad(errorMessage(error) || "Failed to process license", 500);
  }
}
