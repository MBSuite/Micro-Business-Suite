"use client";

import { useEffect, useState } from "react";
import { Link2, Trash2, Plus, Copy } from "lucide-react";

type LinkedShop = {
  module: string;
  shop_code: string;
  shop_name: string;
  company_id: string;
  company_name: string;
  status: "active" | "inactive";
  linked_at: string;
};

const MODULES = ["service", "retail", "rental", "hotel", "fnb", "pharmacy"];

export default function BridgeLinkManagementPage() {
  const [loading, setLoading] = useState(true);
  const [linkedShops, setLinkedShops] = useState<LinkedShop[]>([]);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [showCreateCode, setShowCreateCode] = useState(false);
  const [creatingCode, setCreatingCode] = useState(false);
  const [newCode, setNewCode] = useState<{ code: string; expiresAt: string } | null>(null);
  const [selectedModule, setSelectedModule] = useState("retail");
  const [copied, setCopied] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const linkedRes = await fetch("/api/bridge/link/list");
      if (!linkedRes.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
      const linkedData = await linkedRes.json();
      setLinkedShops(linkedData.links || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadData();
    };
    init();
  }, []);

  const onCreateCode = async () => {
    setCreatingCode(true);
    setError("");
    setNewCode(null);
    try {
      const res = await fetch("/api/bridge/link/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module: selectedModule }),
      });
      const data = await res.json();
      if (!res.ok) {
        let message = data?.error || "สร้างรหัสลิงก์ไม่สำเร็จ";
        if (data?.code === "RATE_LIMITED") {
          message = "สร้างรหัสลิงก์บ่อยเกินไป ลองใหม่ภายหลัง";
        } else if (data?.code === "TENANT_MISMATCH") {
          message = "ไม่มี Core company สำหรับโมดูลนี้";
        } else if (data?.code === "LINK_TABLE_MISSING") {
          message = "ไม่พบตารางการเชื่อมต่อ";
        }
        throw new Error(message);
      }
      setNewCode({
        code: data.code,
        expiresAt: data.expiresAt,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
      setError(message);
    } finally {
      setCreatingCode(false);
    }
  };

  const onCopyCode = async () => {
    if (!newCode) return;
    await navigator.clipboard.writeText(newCode.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onRevokeLink = async (module: string, shopCode: string) => {
    if (!confirm("ยืนยันการยกเลิกลิงก์นี้?")) return;
    setRevoking(`${module}:${shopCode}`);
    setError("");
    try {
      const res = await fetch("/api/bridge/link/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module, shop_code: shopCode }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "ยกเลิกลิงก์ไม่สำเร็จ");
      }
      await loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
      setError(message);
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
            ดูรายการเชื่อมต่อ core-link ระหว่าง Core กับโมดูล และจัดการการเชื่อมต่อ
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {newCode && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <h3 className="text-lg font-black text-green-900 mb-4">รหัสลิงก์ใหม่</h3>
            <div className="bg-white rounded-lg p-4 font-mono text-center text-2xl font-bold text-indigo-600 mb-4 border-2 border-indigo-200">
              {newCode.code}
            </div>
            <div className="text-sm text-green-700 mb-4">
              รหัสนี้จะหมดอายุ{" "}
              {new Date(newCode.expiresAt).toLocaleDateString("th-TH", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div className="flex gap-2">
              <button
                onClick={onCopyCode}
                className="flex-1 h-10 px-4 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 flex items-center justify-center gap-2"
              >
                <Copy size={14} /> {copied ? "คัดลอกแล้ว" : "คัดลอก"}
              </button>
              <button
                onClick={() => {
                  setNewCode(null);
                  setShowCreateCode(false);
                }}
                className="flex-1 h-10 px-4 rounded-lg border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-50"
              >
                ปิด
              </button>
            </div>
          </div>
        )}

        {showCreateCode && !newCode && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-4">สร้างรหัสลิงก์ใหม่</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">เลือกโมดูล</label>
                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  disabled={creatingCode}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold disabled:opacity-50"
                >
                  {MODULES.map((mod) => (
                    <option key={mod} value={mod}>
                      {mod.charAt(0).toUpperCase() + mod.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onCreateCode}
                  disabled={creatingCode}
                  className="flex-1 h-10 px-4 rounded-lg bg-indigo-600 text-white text-sm font-bold disabled:opacity-50 hover:bg-indigo-700"
                >
                  {creatingCode ? "กำลังสร้าง..." : "สร้างรหัส"}
                </button>
                <button
                  onClick={() => {
                    setShowCreateCode(false);
                    setError("");
                  }}
                  disabled={creatingCode}
                  className="flex-1 h-10 px-4 rounded-lg border border-slate-300 text-slate-700 text-sm font-bold disabled:opacity-50 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 text-sm font-bold text-slate-500">
            กำลังโหลด...
          </div>
        ) : (
          <div className="space-y-6">
            {!showCreateCode && !newCode && (
              <button
                onClick={() => setShowCreateCode(true)}
                className="w-full h-11 px-4 rounded-lg bg-indigo-600 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-indigo-700"
              >
                <Plus size={16} /> สร้างรหัสลิงก์ใหม่
              </button>
            )}

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
                        <th className="text-left font-bold text-slate-600 py-3 px-3">โมดูล</th>
                        <th className="text-left font-bold text-slate-600 py-3 px-3">Shop Code</th>
                        <th className="text-left font-bold text-slate-600 py-3 px-3">ชื่อ Shop</th>
                        <th className="text-left font-bold text-slate-600 py-3 px-3">Company ID</th>
                        <th className="text-left font-bold text-slate-600 py-3 px-3">ชื่อ Company</th>
                        <th className="text-left font-bold text-slate-600 py-3 px-3">สถานะ</th>
                        <th className="text-left font-bold text-slate-600 py-3 px-3">เชื่อมต่อเมื่อ</th>
                        <th className="text-left font-bold text-slate-600 py-3 px-3">การกระทำ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linkedShops.map((shop) => (
                        <tr
                          key={`${shop.module}:${shop.shop_code}`}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="py-3 px-3 font-mono text-slate-800 text-xs uppercase">{shop.module}</td>
                          <td className="py-3 px-3 font-mono text-slate-800">{shop.shop_code}</td>
                          <td className="py-3 px-3 text-slate-700">{shop.shop_name}</td>
                          <td className="py-3 px-3 font-mono text-slate-700 text-xs">{shop.company_id}</td>
                          <td className="py-3 px-3 text-slate-700">{shop.company_name}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`text-xs font-bold px-2 py-1 rounded ${shop.status === "active"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-slate-100 text-slate-700"
                                }`}
                            >
                              {shop.status === "active" ? "ใช้งาน" : "ไม่ใช้งาน"}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-500 text-xs whitespace-nowrap">
                            {new Date(shop.linked_at).toLocaleDateString("th-TH", {
                              year: "2-digit",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="py-3 px-3">
                            <button
                              onClick={() => onRevokeLink(shop.module, shop.shop_code)}
                              disabled={revoking === `${shop.module}:${shop.shop_code}`}
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
          </div>
        )}
      </div>
    </main>
  );
}
