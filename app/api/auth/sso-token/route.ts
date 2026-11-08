/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT, importPKCS8 } from "jose";
import { query } from "@/lib/db";

function getHS256Secret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) throw new Error("HS256 secret not configured");
  return new TextEncoder().encode(secret);
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Issues a short-lived RS256 SSO token for a given module audience.
// Requires a valid Core session (HS256 cookie).
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, getHS256Secret());
    const userId = payload.id as string;
    const email = payload.email as string;
    const role = (payload.role as string) || "user";
    const companyId = payload.company_id ?? payload.companyId;

    const body = await req.json().catch(() => ({}));
    const audience = typeof body?.audience === "string" ? body.audience.trim() : "";
    if (!audience) {
      return NextResponse.json({ error: "audience required" }, { status: 400 });
    }

    const privPem = process.env.AUTH_PRIVATE_KEY;
    if (!privPem) {
      return NextResponse.json({ error: "SSO signing key not configured" }, { status: 503 });
    }

    const privateKey = await importPKCS8(privPem, "RS256");
    const jti = crypto.randomUUID();
    const ssoToken = await new SignJWT({
      sub: userId,
      email,
      role,
      company_id: companyId,
      core_user_id: userId,
    })
      .setProtectedHeader({ alg: "RS256", kid: "mbs-core-1" })
      .setIssuer(process.env.AUTH_ISSUER || "https://micro-business-suite.vercel.app")
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime("5m")
      .setJti(jti)
      .sign(privateKey);

    return NextResponse.json({ token: ssoToken, jti });
  } catch (err) {
    console.error("[SSO-TOKEN] Error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
