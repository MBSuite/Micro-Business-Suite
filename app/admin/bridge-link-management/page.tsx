"use client";

import { useEffect, useState } from "react";
import { Link2, Trash2, RefreshCw, Plus } from "lucide-react";

type LinkedShop = {
  linkId: string;
  shopCode: string;
  coreCompanyId: string;
  moduleId: string;
  linkedAt: string;
  status: "active" | "inactive";
};

type LinkCode = {
  code: string;
  createdAt: string;
  expiresAt: string;
  claimedBy?: string;
  status: "pending" | "claimed";
};

export default function BridgeLinkManagementPage() {
  const [loading, setLoading] = useState(true);
  const [linkedShops, setLinkedShops] = useState<LinkedShop[]>([]);
  const [availableCodes, setAvailableCodes] = useState<LinkCode[]>([]);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [tab, setTab] = useState<"linked" | "codes">("linked");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [linkedRes, codesRes] = await Promise.all([
        fetch("/api/bridge/link/list"),
        fetch("/api/bridge/link/code?status=pending"),
      ]);

      if (!linkedRes.ok || !codesRes.ok) {
        throw new Error("โหลดข้อมูลไม่สำเร็จ");
      }

      const linkedData = await linkedRes.json();
      const codesData = await codesRes.json();

      setLinkedShops(linkedData.links || []);
      setAvailableCodes(codesData.codes || []);
    } catch (e: any) {
      setError(e?.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onGenerateCode = async () => {
    setGeneratingCode(true);
    setError("");
    try {
      const res = await fetch("/api/bridge/link/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "สร้างรหัสลิงก์ไม่สำเร็จ");
      }
      await loadData();
    } catch (e: any) {
      setError(e?.message || "เกิดข้อผิดพลาด");
    } finally {
      setGeneratingCode(false);
    }
  };

  const onRevokeLink = async (linkId: string) => {
    if (!confirm("ยืนยันการยกเลิกลิงก์นี้?")) return;
    setRevoking(linkId);
    setError("");
    try {
      const res = await fetch("/api/bridge/link/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "ยกเลิกลิงก์ไม่สำเร็จ");
      }
      await loadData();
    } catch (e: any) {
      setError(e?.message || "เกิดข้อผิดพลาด");
    } finally {
      setRevoking(null);
    }
  };

  return (
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Link2 className="text-indigo-600" /> จัดการลิงก์โมดูล Core
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            ดูรายการจังหวะ core-link ระหว่าง Core กับโมดูล และสร้างรหัสลิงก์สำหรับระบบปะตัวอื่น
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setTab("linked")}
            className={`px-4 py-3 font-bold text-sm border-b-2 transition ${
              tab === "linked"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500"
            }`}
          >
            โมดูลที่เชื่อมต่อแล้ว ({linkedShops.length})
          </button>
          <button
            onClick={() => setTab("codes")}
            className={`px-4 py-3 font-bold text-sm border-b-2 transition ${
              tab === "codes"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500"
            }`}
          >
            รหัสลิงก์ที่พร้อม ({availableCodes.length})
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 text-sm font-bold text-slate-500">
            กำลังโหลด...
          </div>
        ) : tab === "linked" ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4">
              โมดูลที่เชื่อมต่อแล้ว
            </h2>
            {linkedShops.length === 0 ? (
              <p className="text-slate-500 text-sm">ไม่มีโมดูลที่เชื่อมต่อ</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left font-bold text-slate-600 py-3 px-3">รหัส Shop</th>
                      <th className="text-left font-bold text-slate-600 py-3 px-3">Core Company ID</th>
                      <th className="text-left font-bold text-slate-600 py-3 px-3">โมดูล</th>
                      <th className="text-left font-bold text-slate-600 py-3 px-3">สถานะ</th>
                      <th className="text-left font-bold text-slate-600 py-3 px-3">เชื่อมต่อเมื่อ</th>
                      <th className="text-left font-bold text-slate-600 py-3 px-3">การกระทำ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linkedShops.map((shop) => (
                      <tr key={shop.linkId} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-3 font-mono text-slate-800">{shop.shopCode}</td>
                        <td className="py-3 px-3 font-mono text-slate-800">{shop.coreCompanyId}</td>
                        <td className="py-3 px-3 text-slate-700">{shop.moduleId}</td>
                        <td className="py-3 px-3">
                          <span className={`text-xs font-bold px-2 py-1 rounded ${
                            shop.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-700"
                          }`}>
                            {shop.status === "active" ? "ใช้งาน" : "ไม่ใช้งาน"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-xs">
                          {new Date(shop.linkedAt).toLocaleDateString("th-TH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => onRevokeLink(shop.linkId)}
                            disabled={revoking === shop.linkId}
                            className="text-rose-600 hover:text-rose-700 font-bold text-sm disabled:opacity-50 flex items-center gap-1"
                          >
                            <Trash2 size={14} /> ยกเลิก
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">
                รหัสลิงก์ที่พร้อมใช้งาน
              </h2>
              <button
                onClick={onGenerateCode}
                disabled={generatingCode}
                className="h-10 px-4 rounded-lg bg-indigo-600 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-50"
              >
                <Plus size={14} /> {generatingCode ? "กำลังสร้าง..." : "สร้างรหัสใหม่"}
              </button>
            </div>
            {availableCodes.length === 0 ? (
              <p className="text-slate-500 text-sm">ไม่มีรหัสลิงก์ที่พร้อม</p>
            ) : (
              <div className="grid gap-3">
                {availableCodes.map((code) => (
                  <div
                    key={code.code}
                    className="border border-slate-200 rounded-lg p-4 flex justify-between items-center bg-slate-50"
                  >
                    <div>
                      <div className="font-mono font-bold text-lg text-slate-800">{code.code}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        สร้าง {new Date(code.createdAt).toLocaleDateString("th-TH")} | หมดอายุ{" "}
                        {new Date(code.expiresAt).toLocaleDateString("th-TH")}
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      code.status === "pending"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}>
                      {code.status === "pending" ? "รอการใช้งาน" : "ใช้แล้ว"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
