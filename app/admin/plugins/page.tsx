/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
// app/admin/plugins/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Package, Download, Trash2, CheckCircle2, Puzzle } from "lucide-react";

type Pack = {
  id: string; name: string; description: string; targetCustomers: string[];
  modules: string[]; minTier: string; icon: string; color: string;
  installed: boolean; partial: boolean;
  moduleStatus: { id: string; enabled: boolean }[];
};

export default function AdminPluginsPage() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/plugins");
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "โหลดไม่สำเร็จ");
      setPacks(json.packs || []);
    } catch (e: any) { setError(e?.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const act = async (packId: string, action: "install" | "uninstall") => {
    setBusy(packId); setError("");
    try {
      const res = await fetch("/api/admin/plugins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ packId, action }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "ทำรายการไม่สำเร็จ");
      await load();
    } catch (e: any) { setError(e?.message); }
    finally { setBusy(null); }
  };

  return (
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm flex items-center gap-4">
          <Puzzle className="text-indigo-600" size={28} />
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">จัดการปลักอิน / Add-on / Extension</h1>
            <p className="text-slate-500 text-sm mt-1">ติดตั้ง/ถอนการติดตั้ง กลุ่มโมดูล (packs) ต่อ company — MBSuite เป็น Core, add-on ติดตั้งเพิ่มได้</p>
          </div>
        </div>

        {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold px-4 py-3 rounded-xl">{error}</div>}

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 text-sm font-bold text-slate-500">กำลังโหลด...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {packs.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black" style={{ backgroundColor: p.color }}>
                      <Package size={22} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{p.name}</div>
                      <div className="text-[10px] uppercase tracking-widest text-slate-400">min tier: {p.minTier}</div>
                    </div>
                  </div>
                  {p.installed && <CheckCircle2 size={20} className="text-emerald-500" />}
                </div>
                <p className="text-sm text-slate-500">{p.description}</p>
                <div className="text-xs text-slate-400">
                  <span className="font-bold">กลุ่มลูกค้า:</span> {p.targetCustomers.join(", ")}
                </div>
                <div className="text-xs text-slate-400">
                  <span className="font-bold">โมดูล:</span> {p.modules.join(", ")}
                </div>
                {p.partial && <div className="text-xs text-amber-600 font-bold">ติดตั้งบางส่วน</div>}
                <div className="flex gap-2 pt-2">
                  {p.installed ? (
                    <button onClick={() => act(p.id, "uninstall")} disabled={busy === p.id}
                      className="h-10 px-4 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50">
                      <Trash2 size={16} /> {busy === p.id ? "กำลังถอน..." : "ถอนการติดตั้ง"}
                    </button>
                  ) : (
                    <button onClick={() => act(p.id, "install")} disabled={busy === p.id}
                      className="h-10 px-4 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50">
                      <Download size={16} /> {busy === p.id ? "กำลังติดตั้ง..." : "ติดตั้ง"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
