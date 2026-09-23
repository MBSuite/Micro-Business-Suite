import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized — not authenticated" },
        { status: 401 }
      );
    }

    const result = await query(
      "SELECT * FROM company_settings LIMIT 1"
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }
    
    return NextResponse.json({ company: result.rows[0] });
  } catch (e) {
    console.error("GET company error:", e);
    return NextResponse.json({ error: "Failed to fetch company" }, { status: 500 });
  }
}
