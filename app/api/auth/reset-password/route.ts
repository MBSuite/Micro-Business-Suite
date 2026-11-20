/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function getJWTSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("FATAL: JWT secret is not configured.");
  }
  return new TextEncoder().encode(secret);
}

const SECRET = getJWTSecret();

export async function POST(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientKey = forwarded || req.headers.get("x-real-ip") || "unknown";
  const rate = checkRateLimit(`reset:${clientKey}`, 10, 15 * 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "ส่งคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่" },
      { status: 429 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token = typeof body?.token === "string" ? body.token.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const confirmPassword = typeof body?.confirmPassword === "string" ? body.confirmPassword : "";

  if (!token) {
    return NextResponse.json({ error: "ไม่พบ token สำหรับรีเซ็ตรหัสผ่าน" }, { status: 400 });
  }
  if (!password || password.length < 6) {
    return NextResponse.json({ error: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
  }
  if (password !== confirmPassword) {
    return NextResponse.json({ error: "รหัสผ่านไม่ตรงกัน" }, { status: 400 });
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (payload.purpose !== "password-reset") {
      return NextResponse.json({ error: "Token ไม่ถูกต้อง" }, { status: 400 });
    }
    const userId = payload.sub;
    const email = typeof payload.email === "string" ? payload.email : "";
    if (!userId || !email) {
      return NextResponse.json({ error: "Token ไม่ถูกต้อง" }, { status: 400 });
    }

    const res = await query(
      "SELECT id, email, status FROM users WHERE id = $1 AND LOWER(email) = LOWER($2)",
      [userId, email]
    );
    if (res.rows.length === 0) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    }
    const user = res.rows[0];
    if (user.status === "Inactive") {
      return NextResponse.json({ error: "บัญชีถูกระงับ" }, { status: 403 });
    }

    const hashed = await bcrypt.hash(password, 10);
    await query("UPDATE users SET password = $1 WHERE id = $2", [hashed, user.id]);

    return NextResponse.json({ success: true, message: "รีเซ็ตรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบใหม่" });
  } catch (err) {
    console.error("[reset-password] error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Token หมดอายุหรือไม่ถูกต้อง กรุณาขอรีเซ็ตใหม่" }, { status: 400 });
  }
}
