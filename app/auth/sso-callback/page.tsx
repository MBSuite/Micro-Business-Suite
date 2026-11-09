/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";

type SsoState = "loading" | "success" | "error";

function SsoCallbackInner() {
  const searchParams = useSearchParams();
  const audience = searchParams.get("audience") || "";
  const [state, setState] = useState<SsoState>("loading");
  const [error, setError] = useState<string>("");
  const [callbackUrl, setCallbackUrl] = useState<string>("");

  useEffect(() => {
    const performSsoExchange = async () => {
      try {
        if (!audience) {
          setError("ไม่ได้ระบุโมดูล (audience)");
          setState("error");
          return;
        }

        // Call backend to exchange session for SSO token
        // Token is returned in httpOnly cookie automatically
        const res = await fetch("/api/auth/sso-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // Include cookies
          body: JSON.stringify({ audience }),
        });

        const data = await res.json();

        if (!res.ok) {
          console.error("[SSO-CALLBACK] Token exchange failed:", data);
          setError(data.error || "ไม่สามารถขอ token SSO ได้");
          setState("error");
          return;
        }

        // Backend returns the trusted callback URL
        if (!data.callbackUrl) {
          setError("ไม่ได้รับ callback URL จากเซิร์ฟเวอร์");
          setState("error");
          return;
        }

        setCallbackUrl(data.callbackUrl);
        setState("success");

        // Redirect to module callback after a short delay for UX
        // Token is in httpOnly cookie; module will send POST to its /api/auth/sso with the token
        setTimeout(() => {
          window.location.href = data.callbackUrl;
        }, 500);
      } catch (err: any) {
        console.error("[SSO-CALLBACK] Error:", err);
        setError(
          "เกิดข้อผิดพลาด: " + ((err as Error).message || "กรุณาลองใหม่")
        );
        setState("error");
      }
    };

    performSsoExchange();
  }, [audience]);

  if (state === "loading") {
    return (
      <main className="min-h-screen bg-[#f4f6f9] flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded shadow-md p-8 text-center">
            <Loader2 size={48} className="animate-spin mx-auto text-blue-600 mb-4" />
            <h1 className="text-xl font-bold text-gray-800 mb-2">
              กำลังตั้งค่าการเข้าสู่ระบบ...
            </h1>
            <p className="text-sm text-gray-600">
              กรุณารอสักครู่ ระบบกำลังเตรียม token ของคุณ
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (state === "error") {
    return (
      <main className="min-h-screen bg-[#f4f6f9] flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded shadow-md p-8">
            <div className="flex items-start gap-4 mb-6">
              <AlertCircle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h1 className="text-lg font-bold text-red-800">
                  ไม่สามารถเข้าสู่ระบบได้
                </h1>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                href="/login"
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-center"
              >
                กลับไปเข้าสู่ระบบ
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-800 font-medium rounded"
              >
                ลองใหม่
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f6f9] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded shadow-md p-8 text-center">
          <CheckCircle2 size={48} className="mx-auto text-green-600 mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            เข้าสู่ระบบสำเร็จ
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            กำลังส่งต่อไปยังโมดูล...
          </p>
          <div className="text-xs text-gray-500">
            ไปยัง: <code className="bg-gray-100 px-2 py-1 rounded">{audience}</code>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SsoCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-[#f4f6f9]">
          <div className="text-center">
            <Loader2 size={48} className="animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-gray-600">กำลังโหลด...</p>
          </div>
        </main>
      }
    >
      <SsoCallbackInner />
    </Suspense>
  );
}
