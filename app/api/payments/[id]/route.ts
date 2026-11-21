import { NextRequest, NextResponse } from "next/server";
import pool, { query } from "@/lib/db";
import { auth, getUserCompanyId } from "@/lib/auth";

async function isAuthenticated(): Promise<boolean> {
  const session = await auth();
  return Boolean(session?.user);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json(
        { error: "Unauthorized — not authenticated" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const session = await auth();
    const companyId = await getUserCompanyId(session?.user?.id);
    
    const result = await query(
      `SELECT p.*, 
              c.name as customer_name, 
              c.address as customer_address,
              c.tax_id as customer_tax_id,
              i.invoice_number,
              i.net_amount as invoice_net_amount,
              i.vat_amount as invoice_vat_amount,
              i.total_amount as invoice_total_amount,
              COALESCE(p.wht_amount, 0) as invoice_wht_amount
       FROM payments p
       LEFT JOIN invoices i ON p.invoice_id = i.id
       LEFT JOIN contacts c ON i.contact_id = c.id
       WHERE p.id = $1 AND p.company_id = $2`,
      [id, companyId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    
    return NextResponse.json({ payment: result.rows[0] });
  } catch (e) {
    console.error("GET payment error:", e);
    return NextResponse.json({ error: "Failed to fetch payment" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json(
        { error: "Unauthorized — not authenticated" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const session = await auth();
    const companyId = await getUserCompanyId(session?.user?.id);
    
    const result = await query(
      `UPDATE payments 
       SET payment_method = $1, 
           notes = $2,
           updated_at = NOW()
       WHERE id = $3 AND company_id = $4
       RETURNING *`,
      [body.payment_method, body.notes, id, companyId]
    );
    
    if (result.rows.length === 0) {
      const exists = await query(`SELECT 1 FROM payments WHERE id = $1`, [id]);
      if (exists.rows.length === 0) {
        return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: "Forbidden — payment belongs to another company" },
        { status: 403 }
      );
    }
    
    return NextResponse.json({ success: true, payment: result.rows[0] });
  } catch (e) {
    console.error("PUT payment error:", e);
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let client;
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json(
        { error: "Unauthorized — not authenticated" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const session = await auth();
    const companyId = await getUserCompanyId(session?.user?.id);

    // ทุกคำสั่งใน transaction ต้องใช้ connection เดียวกัน — query() ใช้ pool.query
    // ซึ่งอาจไปคนละ connection ทำให้ BEGIN/COMMIT ไม่ครอบคลุม work จริง
    client = await pool.connect();
    await client.query("BEGIN");

    // ล็อกแถวของ tenant นี้ก่อนตรวจสิทธิ์ ป้องกัน race กับคำขออื่น
    const ownerCheck = await client.query(
      `SELECT company_id FROM payments WHERE id = $1 FOR UPDATE`,
      [id]
    );
    if (ownerCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    if (Number(ownerCheck.rows[0].company_id) !== companyId) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Forbidden — payment belongs to another company" },
        { status: 403 }
      );
    }

    // ลบเฉพาะ journal ของใบรับเงินนี้ ผูกด้วย reference_id/reference_type และ company_id
    // (เดิมใช้ LIKE '%RC-<id>%' ซึ่งไม่ผูก tenant และอาจตรงกับเลขที่ซ้ำกัน)
    await client.query(
      `DELETE FROM journal_entries
       WHERE reference_type = 'receipt' AND reference_id = $1 AND company_id = $2`,
      [id, companyId]
    );

    const result = await client.query(
      `DELETE FROM payments WHERE id = $1 AND company_id = $2 RETURNING *`,
      [id, companyId]
    );

    await client.query("COMMIT");

    return NextResponse.json({ success: true, deleted: result.rows[0] });
  } catch (e) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    console.error("DELETE payment error:", e);
    return NextResponse.json({ error: "Failed to delete payment" }, { status: 500 });
  } finally {
    client?.release();
  }
}
