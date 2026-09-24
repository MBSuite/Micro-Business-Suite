import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function hasError(e: unknown): boolean {
  const m = e instanceof Error ? e.message : String(e);
  return (
    m.toLowerCase().includes("relation") ||
    m.toLowerCase().includes("does not exist")
  );
}

// GET /api/admin/customers/[id] - รายละเอียด + ประวัติ subscription
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const superadmin = await isSuperAdmin(session.user.id);
    if (!superadmin) return NextResponse.json({ error: "Permission denied" }, { status: 403 });

    const { id } = await params;
    const companyRes = await query(
      `SELECT * FROM companies WHERE id = $1 LIMIT 1`,
      [parseInt(id, 10)]
    );
    const customer = companyRes.rows[0] || null;
    if (!customer) return NextResponse.json({ error: "ไม่พบลูกค้า" }, { status: 404 });

    const eventsRes = await query(
      `SELECT * FROM subscription_events WHERE company_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [customer.id]
    );
    const usersRes = await query(
      `SELECT id, name, email, role, status, created_at FROM users WHERE company_id = $1 ORDER BY created_at ASC`,
      [customer.id]
    );

    return NextResponse.json({ customer, events: eventsRes.rows, users: usersRes.rows });
  } catch (error: unknown) {
    return NextResponse.json({ error: hasError(error) ? "ฐานข้อมูลยังไม่รองรับ (run migration)" : errorMessage(error) }, { status: 500 });
  }
}

// PATCH /api/admin/customers/[id] - อัปเดตข้อมูล/ราคา/notes หรือ suspend/resume
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const superadmin = await isSuperAdmin(session.user.id);
    if (!superadmin) return NextResponse.json({ error: "Permission denied" }, { status: 403 });

    const { id } = await params;
    const companyId = parseInt(id, 10);
    const body = await request.json();

    const action = String(body?.action || "UPDATE").toUpperCase();

    if (action === "SUSPEND" || action === "RESUME") {
      const newStatus = action === "SUSPEND" ? "Suspended" : "Active";
      await query(
        `UPDATE companies SET subscription_status = $1, updated_at = NOW() WHERE id = $2`,
        [newStatus, companyId]
      );
      await query(
        `
          INSERT INTO subscription_events (company_id, action, notes, payload, created_by)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [companyId, action, action === "SUSPEND" ? "ระงับการใช้งานโดยผู้ดูแลระบบ" : "ปลดล็อกการใช้งาน", JSON.stringify({}), parseInt(session.user.id, 10)]
      );
      return NextResponse.json({ success: true, subscription_status: newStatus });
    }

    const fields: string[] = [];
    const values: unknown[] = [];
    const push = (col: string, val: unknown) => {
      fields.push(`${col} = $${values.length + 1}`);
      values.push(val);
    };

    if (body.name !== undefined) push("name", String(body.name));
    if (body.customer_name !== undefined) push("customer_name", String(body.customer_name) || null);
    if (body.customer_email !== undefined) push("customer_email", String(body.customer_email) || null);
    if (body.customer_phone !== undefined) push("customer_phone", String(body.customer_phone) || null);
    if (body.price_amount !== undefined) push("price_amount", parseFloat(body.price_amount) || 0);
    if (body.price_currency !== undefined) push("price_currency", String(body.price_currency));
    if (body.notes !== undefined) push("notes", String(body.notes));
    if (body.max_users !== undefined) push("max_users", Math.max(1, parseInt(body.max_users, 10) || 1));

    if (fields.length === 0) return NextResponse.json({ error: "ไม่มีข้อมูลให้อัปเดต" }, { status: 400 });
    fields.push("updated_at = NOW()");

    await query(
      `UPDATE companies SET ${fields.join(", ")} WHERE id = $${values.length + 1}`,
      [...values, companyId]
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: errorMessage(error) || "Failed to update customer" }, { status: 500 });
  }
}

// DELETE /api/admin/customers/[id] - ลบได้เฉพาะบริษัทว่าง (ไม่มีผู้ใช้/ธุรกรรม/ใบสำคัญจ่าย)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const superadmin = await isSuperAdmin(session.user.id);
    if (!superadmin) return NextResponse.json({ error: "Permission denied" }, { status: 403 });

    const { id } = await params;
    const companyId = parseInt(id, 10);

    const check = await query(
      `
        SELECT
          (SELECT COUNT(*) FROM users WHERE company_id = $1) AS users,
          (SELECT COUNT(*) FROM invoices WHERE company_id = $1) AS invoices,
          (SELECT COUNT(*) FROM payments WHERE company_id = $1) AS payments,
          (SELECT COUNT(*) FROM subscription_events WHERE company_id = $1) AS events
      `,
      [companyId]
    );
    const counts = check.rows[0];
    const hasData =
      Number(counts?.users || 0) > 0 ||
      Number(counts?.invoices || 0) > 0 ||
      Number(counts?.payments || 0) > 0 ||
      Number(counts?.events || 0) > 0;

    if (hasData) {
      return NextResponse.json(
        { error: "ไม่สามารถลบลูกค้าที่มีข้อมูลอยู่ (ผู้ใช้/ธุรกรรม/ประวัติ) — ใช้การระงับแทน" },
        { status: 409 }
      );
    }

    await query(`DELETE FROM companies WHERE id = $1`, [companyId]);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: errorMessage(error) || "Failed to delete customer" }, { status: 500 });
  }
}