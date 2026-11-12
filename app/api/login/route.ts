/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createTwoFactorPendingToken } from "@/lib/two-factor";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

// Enforce JWT secret: MUST be set in environment, no fallback allowed
function getJWTSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "FATAL: JWT secret is not configured. Set NEXTAUTH_SECRET or AUTH_SECRET environment variable. " +
      "This is a security-critical requirement to prevent session forgery."
    );
  }
  return new TextEncoder().encode(secret);
}

const SECRET = getJWTSecret();

export async function POST(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientKey = forwarded || req.headers.get("x-real-ip") || "unknown";
  const rate = checkRateLimit(`login:${clientKey}`, 20, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rate.resetAt - Date.now()) / 1000)), ...rateLimitHeaders(rate) } },
    );
  }

  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    // Query user with email normalization to handle case differences and accidental whitespace.
    const res = await query(
      "SELECT id, email, password, name, role, status, totp_enabled FROM users WHERE LOWER(email) = LOWER($1)",
      [normalizedEmail]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const user = res.rows[0];

    if (user.status === "Inactive") {
      return NextResponse.json({ error: "Account suspended" }, { status: 403 });
    }

    // Verify password
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (user.totp_enabled) {
      const pendingToken = await createTwoFactorPendingToken(user.id, user.email);
      return NextResponse.json({
        success: false,
        requires2FA: true,
        pendingToken,
      });
    }

    // Create JWT
    const token = await new SignJWT({
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1d")
      .sign(SECRET);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("session-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400, // 1 day
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
  } catch (err) {
    console.error("[LOGIN API] Error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
