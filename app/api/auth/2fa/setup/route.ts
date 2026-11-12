import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import {
  generateBase32Secret,
  encryptSecret,
} from "@/lib/two-factor";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userResult = await query(
    "SELECT email, totp_enabled FROM users WHERE id = $1 LIMIT 1",
    [session.user.id],
  );
  const user = userResult.rows[0];
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (user.totp_enabled) {
    return NextResponse.json({ error: "Two-factor authentication is already enabled" }, { status: 409 });
  }

  const secret = generateBase32Secret();
  await query(
    "UPDATE users SET totp_secret = $1, totp_enabled = FALSE, totp_verified_at = NULL WHERE id = $2",
    [encryptSecret(secret), session.user.id],
  );
  await query("DELETE FROM user_recovery_codes WHERE user_id = $1", [session.user.id]);

  const issuer = "Micro-Business-Suite";
  const account = encodeURIComponent(user.email);
  const otpauthUri = `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

  return NextResponse.json({ secret, otpauthUri });
}
