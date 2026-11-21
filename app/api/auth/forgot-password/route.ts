/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { query } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

function getJWTSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("FATAL: JWT secret is not configured.");
  }
  return new TextEncoder().encode(secret);
}

const SECRET = getJWTSecret();

function getBaseUrl(req: Request): string {
  const envUrl = (process.env.NEXTAUTH_URL || "").trim().replace(/\/$/, "");
  if (envUrl) return envUrl;
  const proto = req.headers.get("x-forwarded-proto") || "http";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}

export async function POST(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientKey = forwarded || req.headers.get("x-real-ip") || "unknown";
  const rate = checkRateLimit(`forgot:${clientKey}`, 5, 15 * 60_000);
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

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "กรุณากรอกอีเมลให้ถูกต้อง" }, { status: 400 });
  }

  // Always respond generically to avoid email enumeration.
  const generic = {
    success: true,
    message: "หากอีเมลนี้มีในระบบ จะได้รับลิงก์รีเซ็ตรหัสผ่านภายในไม่กี่นาที",
  };

  try {
    const res = await query(
      "SELECT id, email, name, status FROM users WHERE LOWER(email) = LOWER($1)",
      [email]
    );

    if (res.rows.length === 0) {
      return NextResponse.json(generic);
    }

    const user = res.rows[0];
    if (user.status === "Inactive") {
      // Do not reveal; behave as success.
      return NextResponse.json(generic);
    }

    // สร้าง reset token อายุ 1 ชม. และเก็บ jti ใน ledger เพื่อบังคับใช้ครั้งเดียว
    // (ดู migration add_password_reset_single_use.sql)
    const jti = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    const token = await new SignJWT({
      sub: String(user.id),
      email: user.email,
      purpose: "password-reset",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .setJti(jti)
      .sign(SECRET);

    await query(
      `INSERT INTO password_reset_tokens (jti, user_id, expires_at)
       VALUES ($1, $2, $3)`,
      [jti, user.id, expiresAt]
    );

    const resetUrl = `${getBaseUrl(req)}/login?reset=${encodeURIComponent(token)}`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
        <h2 style="color:#1d4ed8;">รีเซ็ตรหัสผ่าน — Micro-Business-Suite</h2>
        <p>สวัสดี ${escapeHtml(user.name || "")},</p>
        <p>เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ คลิกลิงก์ด้านล่างเพื่อตั้งรหัสผ่านใหม่ (ลิงก์หมดอายุใน 1 ชั่วโมง):</p>
        <p style="margin:24px 0;">
          <a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">ตั้งรหัสผ่านใหม่</a>
        </p>
        <p style="font-size:12px;color:#6b7280;word-break:break-all;">หรือคัดลอกลิงก์นี้: ${resetUrl}</p>
        <p style="font-size:12px;color:#6b7280;">หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน สามารถเพิกเฉยอีเมลนี้ได้</p>
      </div>
    `;

    const result = await sendEmail({
      to: user.email,
      subject: "รีเซ็ตรหัสผ่าน — Micro-Business-Suite",
      html,
      text: `ตั้งรหัสผ่านใหม่: ${resetUrl}`,
    });

    if (!result.sent) {
      // ห้ามพิมพ์ reset URL/token ลง log — ผู้ที่อ่าน log สามารถเปลี่ยนรหัสผ่านได้
      console.warn("[forgot-password] email delivery unavailable; reset link withheld from logs");
    }

    return NextResponse.json(generic);
  } catch (err) {
    console.error("[forgot-password] error:", err instanceof Error ? err.message : err);
    return NextResponse.json(generic);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
