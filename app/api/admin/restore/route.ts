import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/core-standards";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canAccessAdmin(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No backup file provided" }, { status: 400 });
    }
    const text = await file.text();

    // Basic JSON restore (skeleton for safety)
    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "File must be JSON backup" }, { status: 400 });
    }

    if (!parsed?.tables) {
      return NextResponse.json({ error: "Invalid backup format: missing tables" }, { status: 400 });
    }

    // Log audit
    console.log(`[AUDIT] Restore initiated by admin: ${session.user.email}`);

    return NextResponse.json({
      success: true,
      message: "Restore file validated — full database restoration requires manual execution (security guard). Tables detected: " + Object.keys(parsed.tables).join(", "),
      meta: parsed.meta || {},
    });
  } catch (error: any) {
    console.error("[ERROR] Restore operation failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
