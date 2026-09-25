import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

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

const PUBLIC_PATHS = ["/login", "/register", "/api/login", "/api/logout"];
const PUBLIC_PREFIXES = ["/api/auth"];

// APIs intentionally callable without a session.
// Everything else under /api/* now requires a valid session-token.
const PUBLIC_API_EXACT = new Set(["/api/login", "/api/logout", "/api/fx-rate"]);
const PUBLIC_API_PREFIXES = ["/api/auth"];

function isPublicApi(pathname: string): boolean {
  return (
    PUBLIC_API_EXACT.has(pathname) ||
    PUBLIC_API_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  );
}

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublicPath = PUBLIC_PATHS.includes(pathname);
  const isPublicPrefix = PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  const isApi = pathname.startsWith("/api/");

  if (isPublicPath || isPublicPrefix) {
    return NextResponse.next();
  }

  // Check session token from cookie
  const token = req.cookies.get("session-token")?.value;
  const session = token ? await verifyToken(token) : null;

  if (session) {
    return NextResponse.next();
  }

  if (isApi) {
    if (isPublicApi(pathname)) {
      return NextResponse.next();
    }
    // API endpoints return JSON 401 instead of redirecting to the login page.
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Static assets (public/) และ common files ต้อง bypass middleware
  // ไม่เช่นนั้นไฟล์เช่น /logo.png ที่ไม่มี session จะโดน redirect ไป login
  // ทำให้ logo/รูปภาพไม่แสดงผล
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:png|jpe?g|gif|webp|svg|ico|css|js|mjs|woff2?|ttf|map|pdf)$).*)",
  ],
};