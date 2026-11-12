import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import pool from "@/lib/db";
import {
  decryptSecret,
  verifyTotp,
  normalizeRecoveryCode,
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
  const recoveryCode = typeof body?.recoveryCode === "string" ? body.recoveryCode.trim() : "";

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "SELECT totp_secret, totp_enabled FROM users WHERE id = $1 LIMIT 1 FOR UPDATE",
      [session.user.id],
    );
    const row = result.rows[0];
    if (!row?.totp_enabled) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Two-factor authentication is not enabled" }, { status: 400 });
    }

    let verified = false;
    if (code) {
      const secret = decryptSecret(row.totp_secret);
      verified = verifyTotp(secret, code);
    } else if (recoveryCode) {
      const hash = hashRecoveryCode(recoveryCode);
      const recoveryResult = await client.query(
        "SELECT id FROM user_recovery_codes WHERE user_id = $1 AND code_hash = $2 AND used_at IS NULL LIMIT 1",
        [session.user.id, hash],
      );
      if (recoveryResult.rows[0]) {
        await client.query(
          "UPDATE user_recovery_codes SET used_at = NOW() WHERE id = $1",
          [recoveryResult.rows[0].id],
        );
        verified = true;
      }
    }

    if (!verified) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    await client.query(
      "UPDATE users SET totp_secret = NULL, totp_enabled = FALSE, totp_verified_at = NULL WHERE id = $1",
      [session.user.id],
    );
    await client.query("DELETE FROM user_recovery_codes WHERE user_id = $1", [session.user.id]);
    await client.query("COMMIT");

    return NextResponse.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK");
    return NextResponse.json({ error: "Failed to disable 2FA" }, { status: 500 });
  } finally {
    client.release();
  }
}
