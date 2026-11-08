import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Serves the Core public signing key as JWKS for SSO token verification by modules.
export async function GET() {
  const jwkRaw = process.env.AUTH_PUBLIC_JWK;
  if (!jwkRaw) {
    return NextResponse.json({ error: "JWKS not configured" }, { status: 503 });
  }
  let jwk: unknown;
  try {
    jwk = JSON.parse(jwkRaw);
  } catch {
    return NextResponse.json({ error: "Invalid JWKS config" }, { status: 500 });
  }
  return NextResponse.json({ keys: [jwk] });
}
