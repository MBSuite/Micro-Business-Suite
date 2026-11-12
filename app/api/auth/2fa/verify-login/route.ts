import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  decryptSecret,
  verifyTotp,
  verifyTwoFactorPendingToken,
  hashRecoveryCode,
} from "@/lib/two-factor";

export const dynamic = "force-dynamic";

function getJWTSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) throw new Error("FATAL: JWT secret is not configured.");
  return new TextEncoder().encode(secret);
}

export async function POST(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientKey = forwarded || req.headers.get("x-real-ip") || "unknown";
  const rate = checkRateLimit(`2fa-verify:${clientKey}`, 20, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many verification attempts. Please try again later." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const pendingToken = typeof body?.pendingToken === "string" ? body.pendingToken.trim() : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const recoveryCode = typeof body?.recoveryCode === "string" ? body.recoveryCode.trim() : "";

  if (!pendingToken || (!code && !recoveryCode)) {
    return NextResponse.json({ error: "Pending token and verification code are required" }, { status: 400 });
  }

  const pending = await verifyTwoFactorPendingToken(pendingToken);
  if (!pending) {
    return NextResponse.json({ error: "Invalid or expired 2FA session" }, { status: 401 });
  }

  const userResult = await query(
    "SELECT id, email, password, name, role, status, totp_secret, totp_enabled FROM users WHERE id = $1 LIMIT 1",
    [pending.id],
  );
  const user = userResult.rows[0];
  if (!user || user.status === "Inactive" || !user.totp_enabled || !user.totp_secret) {
    return NextResponse.json({ error: "Invalid 2FA configuration" }, { status: 401 });
  }

  const secret = decryptSecret(user.totp_secret);
  let verified = false;
  if (code) {
    verified = verifyTotp(secret, code);
  } else if (recoveryCode) {
    const hash = hashRecoveryCode(recoveryCode);
    const recoveryResult = await query(
      "SELECT id FROM user_recovery_codes WHERE user_id = $1 AND code_hash = $2 AND used_at IS NULL LIMIT 1",
      [user.id, hash],
    );
    if (recoveryResult.rows[0]) {
      await query("UPDATE user_recovery_codes SET used_at = NOW() WHERE id = $1", [recoveryResult.rows[0].id]);
      verified = true;
    }
  }

  if (!verified) {
    return NextResponse.json({ error: "Invalid verification code" }, { status: 401 });
  }

  const token = await new SignJWT({
    id: user.id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(getJWTSecret());

  const cookieStore = await cookies();
  cookieStore.set("session-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 86400,
    path: "/",
  });

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
}
