import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await query(
    "SELECT totp_enabled, totp_verified_at FROM users WHERE id = $1 LIMIT 1",
    [session.user.id],
  );
  const row = result.rows[0];
  if (!row) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    enabled: Boolean(row.totp_enabled),
    verifiedAt: row.totp_verified_at ?? null,
  });
}
