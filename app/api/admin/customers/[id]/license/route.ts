import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";
import { createLicenseKey, getSigningSalt, type LicensePayload } from "@/lib/license";
import { LICENSE_PACKAGES, LICENSE_TIERS, getLicensePackage } from "@/lib/license-packages";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// รายการฟีเจอร์ที่ระบบรู้จัก (กรอง input ไม่ให้ฝัง feature เกินจริง)
const KNOWN_FEATURES = Array.from(
  new Set(Object.values(LICENSE_PACKAGES).flatMap((p) => p.defaultFeatures))
);

// POST /api/admin/customers/[id]/license - ออก key ใหม่ / ต่ออายุ
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const superadmin = await isSuperAdmin(session.user.id);
    if (!superadmin) return NextResponse.json({ error: "Permission denied" }, { status: 403 });

    const { id } = await params;
    const companyId = parseInt(id, 10);
    const body = await request.json();

    const action = String(body?.action || "ISSUE").toUpperCase();
    if (action !== "ISSUE" && action !== "RENEW") {
      return NextResponse.json({ error: "action ต้องเป็น ISSUE หรือ RENEW" }, { status: 400 });
    }

    const mode = String(body?.mode || "subscription").toLowerCase();
    if (!["perpetual", "subscription"].includes(mode)) {
      return NextResponse.json({ error: "mode ต้องเป็น perpetual หรือ subscription" }, { status: 400 });
    }

    const tier = String(body?.license_type || "PROFESSIONAL").toUpperCase();
    if (!(LICENSE_TIERS as readonly string[]).includes(tier)) {
      return NextResponse.json({ error: `license_type ต้องเป็น ${LICENSE_TIERS.join(" / ")}` }, { status: 400 });
    }
    if (mode === "subscription" && (tier as string) === "TRIAL" && action === "ISSUE") {
      return NextResponse.json({ error: "TRIAL เป็นสถานะสมัครเอง ไม่ต้องออก key — เลือก STANDARD ขึ้นไป" }, { status: 400 });
    }

    const expires = body?.expires ? String(body.expires).trim() : "";
    if (mode === "subscription" && !/^\d{4}-\d{2}-\d{2}$/.test(expires)) {
      return NextResponse.json({ error: "subscription require expires ในรูปแบบ YYYY-MM-DD" }, { status: 400 });
    }

    const companyRes = await query(`SELECT * FROM companies WHERE id = $1 LIMIT 1`, [companyId]);
    const company = companyRes.rows[0];
    if (!company) return NextResponse.json({ error: "ไม่พบลูกค้า" }, { status: 404 });

    const pkg = getLicensePackage(tier);
    const maxUsers = Math.max(1, parseInt(body?.max_users || String(pkg.defaultMaxUsers), 10) || pkg.defaultMaxUsers);
    const maxTx = Math.max(1, parseInt(body?.max_transactions || String(pkg.defaultMaxTransactionsPerMonth), 10) || pkg.defaultMaxTransactionsPerMonth);

    let features: string[];
    if (Array.isArray(body?.features) && body.features.length > 0) {
      features = Array.from(
        new Set(body.features.map((f: string) => String(f).trim()).filter((f: string) => f && KNOWN_FEATURES.includes(f)))
      );
      if (features.length === 0) features = [...pkg.defaultFeatures];
    } else {
      features = [...pkg.defaultFeatures];
    }

    const payload: LicensePayload = {
      product: "micro-business-suite",
      mode: mode as LicensePayload["mode"],
      license_type: tier as LicensePayload["license_type"],
      licensee: String(body?.licensee || company?.customer_email || company.customer_name || "customer"),
      company: String(company?.name || "Your Company"),
      issued_at: new Date().toISOString(),
      ...(mode === "subscription" ? { expires_at: `${expires}T23:59:59.999Z` } : {}),
      max_users: maxUsers,
      max_transactions_per_month: maxTx,
      allowed_features: features,
    };

    const salt = getSigningSalt();
    const licenseKey = createLicenseKey(payload, salt);
    const expiresAt = mode === "subscription" ? payload.expires_at : null;

    await query(
      `
        UPDATE companies SET
          license_key = $1,
          plan_type = $2,
          max_users = $3,
          subscription_status = 'Active',
          expiry_date = $4,
          trial_end = NULL,
          last_renewed_at = NOW(),
          price_amount = $5,
          price_currency = $6,
          updated_at = NOW()
        WHERE id = $7
      `,
      [
        licenseKey,
        tier,
        maxUsers,
        expiresAt,
        parseFloat(body?.price_amount || company?.price_amount || "0") || 0,
        String(body?.price_currency || company?.price_currency || "THB"),
        companyId,
      ]
    );

    await query(
      `
        INSERT INTO subscription_events (
          company_id, action, license_type, license_key, expires_at, max_users,
          amount, notes, payload, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [
        companyId,
        action,
        tier,
        licenseKey,
        expiresAt,
        maxUsers,
        parseFloat(body?.price_amount || "0") || null,
        String(body?.notes || (action === "RENEW" ? "ต่ออายุการใช้งาน" : "ออก license ใหม่")) || null,
        JSON.stringify({ mode, max_transactions_per_month: maxTx, features }),
        parseInt(session.user.id, 10),
      ]
    );

    return NextResponse.json({
      success: true,
      action,
      license_key: licenseKey,
      payload,
    });
  } catch (error: unknown) {
    console.error("POST /api/admin/customers/[id]/license error:", error);
    return NextResponse.json({ error: errorMessage(error) || "Failed to issue license" }, { status: 500 });
  }
}