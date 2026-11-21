/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
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
    const jti = typeof payload.jti === "string" ? payload.jti : "";
    if (!userId || !email || !jti) {
      return NextResponse.json({ error: "Token ไม่ถูกต้อง" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // บริโภค jti แบบ atomic — ใช้ได้ครั้งเดียวภายในอายุ token
      const ledger = await client.query(
        `SELECT user_id FROM password_reset_tokens
         WHERE jti = $1 AND used_at IS NULL AND expires_at > NOW() FOR UPDATE`,
        [jti]
      );
      if (ledger.rows.length === 0 || String(ledger.rows[0].user_id) !== String(userId)) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Token หมดอายุหรือใช้ไปแล้ว กรุณาขอรีเซ็ตใหม่" },
          { status: 400 }
        );
      }

      const res = await client.query(
        "SELECT id, email, status FROM users WHERE id = $1 AND LOWER(email) = LOWER($2) FOR UPDATE",
        [userId, email]
      );
      if (res.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
      }
      const user = res.rows[0];
      if (user.status === "Inactive") {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "บัญชีถูกระงับ" }, { status: 403 });
      }

      const hashed = await bcrypt.hash(password, 10);
      await client.query(
        "UPDATE users SET password = $1, password_changed_at = NOW() WHERE id = $2",
        [hashed, user.id]
      );
      await client.query("UPDATE password_reset_tokens SET used_at = NOW() WHERE jti = $1", [jti]);
      await client.query("COMMIT");

      return NextResponse.json({ success: true, message: "รีเซ็ตรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบใหม่" });
    } catch (err) {
      try { await client.query("ROLLBACK"); } catch {}
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("[reset-password] error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Token หมดอายุหรือไม่ถูกต้อง กรุณาขอรีเซ็ตใหม่" }, { status: 400 });
  }
}
