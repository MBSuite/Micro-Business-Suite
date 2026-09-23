"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, CheckCircle, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function FixAdminPage() {
  const [targetEmail, setTargetEmail] = useState("");
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let ignore = false;
    async function loadCurrentUser() {
      try {
        const res = await fetch("/api/me");
        if (res.ok) {
          const data = await res.json();
          if (!ignore && data?.user?.email) {
            setTargetEmail(data.user.email);
            setCurrentRole(data.user.role || "user");
          }
        }
      } catch (err) {
        console.error("Failed to load current session user:", err);
      }
    }
    loadCurrentUser();
    return () => {
      ignore = true;
    };
  }, []);

  async function handlePromote(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const emailToPromote = targetEmail.trim();
    if (!emailToPromote) {
      setStatus("error");
      setMsg("กรุณาระบุอีเมลที่ต้องการเปลี่ยนสิทธิ์");
      return;
    }

    setStatus("loading");
    setMsg("");
    try {
      const { promoteUserAction } = await import("../db-init");
      const res = await promoteUserAction(emailToPromote);
      if (res.success) {
        setStatus("success");
        setMsg(res.message || "ดำเนินการสำเร็จ");
      } else {
        setStatus("error");
        setMsg(res.error || "เกิดข้อผิดพลาดในการดำเนินการ");
      }
    } catch (e: unknown) {
      setStatus("error");
      const errorMsg = e instanceof Error ? e.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ";
      setMsg(errorMsg);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-10 text-white shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <Link
            href="/login"
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <ArrowLeft size={14} /> กลับไปหน้าเข้าสู่ระบบ
          </Link>
          <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 border border-blue-500/20">
            <ShieldCheck size={24} />
          </div>
        </div>
        
        <h1 className="text-2xl font-black text-center mb-2 tracking-tight">Promote Administrator</h1>
        <p className="text-slate-400 text-center text-sm mb-6">
          กำหนดบทบาทผู้ดูแลระบบสูงสุด (Superadmin)
        </p>

        {status === "success" ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl text-center space-y-4">
            <CheckCircle className="text-emerald-500 mx-auto" size={48} />
            <p className="text-emerald-400 font-bold text-sm">{msg}</p>
            <button
              onClick={() => {
                window.location.href = "/login";
              }}
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl uppercase tracking-widest text-xs transition-colors"
            >
              เข้าสู่ระบบใหม่
            </button>
          </div>
        ) : (
          <form onSubmit={handlePromote} className="space-y-4">
            {status === "error" && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-center gap-3 text-rose-400 text-xs">
                <AlertCircle size={16} className="shrink-0" />
                <span>{msg}</span>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="emailInput" className="text-xs font-semibold text-slate-300">
                อีเมลผู้ใช้ที่ต้องการอัปเกรด
              </label>
              <input
                id="emailInput"
                type="email"
                required
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              {currentRole && (
                <p className="text-[11px] text-slate-400">
                  สถานะปัจจุบันในเซสชัน: <span className="text-blue-400 font-semibold">{currentRole}</span>
                </p>
              )}
            </div>

            <button 
              type="submit"
              disabled={status === "loading" || !targetEmail}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-blue-900/40 uppercase tracking-widest text-sm transition-all mt-4"
            >
              {status === "loading" ? <Loader2 className="animate-spin" size={20} /> : "ยืนยันการตั้งค่าผู้ดูแลระบบ"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
