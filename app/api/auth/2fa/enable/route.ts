import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import pool from "@/lib/db";
import {
  decryptSecret,
  verifyTotp,
  generateRecoveryCodes,
  hashRecoveryCode,
} from "@/lib/two-factor";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  if (!code) {
    return NextResponse.json({ error: "Verification code is required" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "SELECT totp_secret, totp_enabled FROM users WHERE id = $1 LIMIT 1 FOR UPDATE",
      [session.user.id],
    );
    const row = result.rows[0];
    if (!row?.totp_secret) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Run 2FA setup first" }, { status: 400 });
    }
    if (row.totp_enabled) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Two-factor authentication is already enabled" }, { status: 409 });
    }

    const secret = decryptSecret(row.totp_secret);
    if (!verifyTotp(secret, code)) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    const recoveryCodes = generateRecoveryCodes();
    await client.query(
      "UPDATE users SET totp_enabled = TRUE, totp_verified_at = NOW() WHERE id = $1",
      [session.user.id],
    );
    await client.query("DELETE FROM user_recovery_codes WHERE user_id = $1", [session.user.id]);
    for (const recoveryCode of recoveryCodes) {
      await client.query(
        "INSERT INTO user_recovery_codes (user_id, code_hash) VALUES ($1, $2)",
        [session.user.id, hashRecoveryCode(recoveryCode)],
      );
    }
    await client.query("COMMIT");

    return NextResponse.json({ success: true, recoveryCodes });
  } catch (error) {
    await client.query("ROLLBACK");
    return NextResponse.json({ error: "Failed to enable 2FA" }, { status: 500 });
  } finally {
    client.release();
  }
}
