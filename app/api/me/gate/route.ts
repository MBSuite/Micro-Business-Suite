import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCompanyGate } from "@/lib/company-gate";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// GET /api/me/gate - สถานะสิทธิ์/แผนของบริษัทผู้ใช้ปัจจุบัน
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const gate = await getCompanyGate(session.user.id);
    return NextResponse.json({ gate });
  } catch (error: unknown) {
    return NextResponse.json({ error: errorMessage(error) || "Failed to load gate" }, { status: 500 });
  }
}