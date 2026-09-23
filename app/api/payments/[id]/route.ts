import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
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

    const ownerCheck = await query(`SELECT company_id FROM payments WHERE id = $1`, [id]);
    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    if (Number(ownerCheck.rows[0].company_id) !== companyId) {
      return NextResponse.json(
        { error: "Forbidden — payment belongs to another company" },
        { status: 403 }
      );
    }

    // ลบ payment และ journal entries ที่เกี่ยวข้อง
    await query("BEGIN");
    
    // ลบ journal entries ที่ลิงก์กับ payment นี้ (ค้นหาผ่าน reference_no ที่มีเลข payment)
    await query(
      `DELETE FROM journal_entries WHERE reference_no LIKE $1 OR description LIKE $2`,
      [`%RC-${id}%`, `%รับชำระ%`]
    );
    
    // ลบ payment
    const result = await query(
      "DELETE FROM payments WHERE id = $1 RETURNING *",
      [id]
    );
    
    await query("COMMIT");
    
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, deleted: result.rows[0] });
  } catch (e) {
    await query("ROLLBACK");
    console.error("DELETE payment error:", e);
    return NextResponse.json({ error: "Failed to delete payment" }, { status: 500 });
  }
}
