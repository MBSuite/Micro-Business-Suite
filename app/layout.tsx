/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
import type { Metadata } from "next";
import "./globals.css";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { ToastProvider } from "@/components/ToastProvider";
import LayoutWrapper from "@/components/LayoutWrapper";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Micro-Business-Suite | ระบบจัดการบัญชีอัจฉริยะ",
  description: "จัดการบัญชี รายรับ รายจ่าย เอกสาร และภาษีธุรกิจได้ในระบบเดียว",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

// In-memory cache for user status (short TTL) to reduce DB round-trips on every navigation
type CachedUserStatus = { status: string | null; name: string | null; email: string | null; expiresAt: number };
const userStatusCache = new Map<string, CachedUserStatus>();
const USER_STATUS_TTL_MS = 30_000;

async function getCachedUserStatus(userId: string): Promise<CachedUserStatus> {
  const cached = userStatusCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached;
  const res = await query("SELECT status, name, email FROM users WHERE id = $1", [userId]);
  const row = res.rows[0];
  const value: CachedUserStatus = {
    status: row?.status ?? null,
    name: row?.name ?? null,
    email: row?.email ?? null,
    expiresAt: Date.now() + USER_STATUS_TTL_MS,
  };
  userStatusCache.set(userId, value);
  return value;
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const isLoggedIn = !!session;

  // 🔥 Fetch latest status to ensure security (cached to reduce DB round-trips)
  const cachedStatus = isLoggedIn && session?.user?.id ? await getCachedUserStatus(String(session.user.id)) : null;
  const isPending = cachedStatus?.status === "Pending";

  const userName = cachedStatus?.name || session?.user?.name || "Administrator";
  const userRole = (session?.user as any)?.role || "Active Edge";

  return (
    <html lang="th">
      <body
        className="antialiased font-sans bg-[#fdfaff] text-slate-900 scroll-smooth"
      >
        <Providers>
          <ToastProvider>
            <LayoutWrapper 
              isLoggedIn={isLoggedIn} 
              userName={userName} 
              userRole={userRole} 
              isPending={isPending}
            >
              {children}
            </LayoutWrapper>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
