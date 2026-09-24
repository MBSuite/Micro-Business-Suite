import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";
import { trialEndFromNow } from "@/lib/company-gate";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// GET /api/admin/customers - รายการลูกค้า (superadmin เท่านั้น)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const superadmin = await isSuperAdmin(session.user.id);
    if (!superadmin) {
      return NextResponse.json({ error: "Permission denied — superadmin only" }, { status: 403 });
    }

    const result = await query(
      `
        SELECT
          c.id,
          c.name,
          c.plan_type,
          c.max_users,
          c.subscription_status,
          c.expiry_date,
          c.license_key,
          c.trial_end,
          c.customer_name,
          c.customer_email,
          c.customer_phone,
          c.price_amount,
          c.price_currency,
          c.last_renewed_at,
          c.created_at,
          c.notes,
          COUNT(DISTINCT u.id) FILTER (WHERE u.id IS NOT NULL) AS user_count,
          COUNT(se.id) FILTER (WHERE se.id IS NOT NULL) AS event_count,
          SUM(se.amount) FILTER (WHERE se.amount IS NOT NULL) AS total_paid
        FROM companies c
        LEFT JOIN users u ON u.company_id = c.id
        LEFT JOIN subscription_events se ON se.company_id = c.id
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `
    );

    return NextResponse.json({ customers: result.rows });
  } catch (error: unknown) {
    console.error("GET /api/admin/customers error:", error);
    return NextResponse.json(
      { error: errorMessage(error) || "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

// POST /api/admin/customers - สร้างลูกค้า/บริษัทใหม่ (พร้อม trial_end เริ่มต้น)
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const superadmin = await isSuperAdmin(session.user.id);
    if (!superadmin) {
      return NextResponse.json({ error: "Permission denied — superadmin only" }, { status: 403 });
    }

    const body = await request.json();
    const name = String(body?.name || "").trim();
    if (!name) {
      return NextResponse.json({ error: "กรุณาระบุชื่อบริษัท" }, { status: 400 });
    }

    const result = await query(
      `
        INSERT INTO companies (
          name, plan_type, max_users, subscription_status, expiry_date,
          customer_name, customer_email, customer_phone, price_amount, price_currency,
          trial_end, notes
        )
        VALUES ($1, $2, $3, $4, NULL, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, name, plan_type, max_users, subscription_status, trial_end, created_at
      `,
      [
        name,
        String(body?.plan_type || "TRIAL").toUpperCase(),
        Math.max(1, parseInt(body?.max_users || "1", 10) || 1),
        "Active",
        body?.customer_name ? String(body.customer_name) : null,
        body?.customer_email ? String(body.customer_email) : null,
        body?.customer_phone ? String(body.customer_phone) : null,
        parseFloat(body?.price_amount || "0") || 0,
        String(body?.price_currency || "THB"),
        trialEndFromNow(14),
        body?.notes ? String(body.notes) : null,
      ]
    );

    const created = result.rows[0];
    await query(
      `
        INSERT INTO subscription_events (company_id, action, license_type, notes, payload, created_by)
        VALUES ($1, 'NOTE', $2, 'สร้างลูกค้าใหม่โดยผู้ดูแลระบบ', $3, $4)
      `,
      [created.id, created.plan_type, JSON.stringify({ source: "admin-console" }), parseInt(session.user.id, 10)]
    );

    return NextResponse.json({ customer: created }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/admin/customers error:", error);
    return NextResponse.json(
      { error: errorMessage(error) || "Failed to create customer" },
      { status: 500 }
    );
  }
}