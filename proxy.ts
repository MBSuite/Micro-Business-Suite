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

// --- Simple in-memory rate limiter (single-instance; use Redis/Upstash for multi-instance prod) ---
type RateBucket = { count: number; resetAt: number };
const rateBuckets = new Map<string, RateBucket>();

function rateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  if (bucket.count >= limit) {
    return { allowed: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { allowed: true, retryAfter: 0 };
}

// Periodic cleanup to avoid unbounded memory growth
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of rateBuckets) {
      if (v.resetAt <= now) rateBuckets.delete(k);
    }
  }, 60_000).unref?.();
}

const PUBLIC_PATHS = ["/", "/login", "/register", "/api/login", "/api/logout"];
const PUBLIC_PREFIXES = ["/api/auth"];

// Bridge sync is passed through so its route handler can validate either a
// service Bearer token or a user session. Other APIs require a session-token.
const PUBLIC_API_EXACT = new Set([
  "/api/login",
  "/api/logout",
  "/api/register",
  "/api/fx-rate",
  "/api/health",
  "/api/bridge/sync",
]);
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

  if (pathname === "/api/register" && req.method === "POST") {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    const rl = rateLimit(`register:${ip}`, 5, 15 * 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "ส่งคำขอสมัครบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter), "Cache-Control": "no-store" } }
      );
    }
  }

  // Rate limiting: login endpoint (brute-force protection)
  if (pathname === "/api/login") {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    const rl = rateLimit(`login:${ip}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }
  }

  // Rate limiting: general API (per IP, generous)
  if (pathname.startsWith("/api/")) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    const rl = rateLimit(`api:${ip}`, 120, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }
  }

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
    // Role-based guard for admin areas
    const role = String(session.role || "").toLowerCase();
    const isAdmin = role === "admin" || role === "superadmin";
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
      if (!isAdmin) {
        if (isApi) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
    // Superadmin-only console
    if (pathname.startsWith("/admin/customers") || pathname.startsWith("/api/admin/customers")) {
      if (role !== "superadmin") {
        if (isApi) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/admin/modules", req.url));
      }
    }
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