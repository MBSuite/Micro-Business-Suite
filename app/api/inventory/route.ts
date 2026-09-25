import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth, getUserCompanyId } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized — not authenticated" },
        { status: 401 }
      );
    }

    const companyId = await getUserCompanyId(session.user.id);
    const result = await query(
      `
      SELECT
        id,
        name,
        sku_number,
        price,
        type,
        category_name,
        stock_quantity
      FROM products
      WHERE company_id = $1
      ORDER BY name ASC
    `,
      [companyId]
    );

    return NextResponse.json({ success: true, products: result.rows });
  } catch (error) {
    console.error("GET /api/inventory error", error);
    return NextResponse.json({ success: false, message: "Cannot fetch inventory" }, { status: 500 });
  }
}