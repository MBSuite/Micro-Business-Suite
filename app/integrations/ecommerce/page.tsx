/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
// app/integrations/ecommerce/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Truck, Plus, Trash2 } from "lucide-react";

const PROVIDERS = [
  { id: "shopee", name: "Shopee" },
  { id: "lazada", name: "Lazada" },
  { id: "webstore", name: "เว็บไซต์ร้าน (Webstore)" },
];

type Conn = { id: number; provider: string; name: string; status: string; last_sync_at: string | null };

export default function EcommerceIntegrationPage() {
  const [conns, setConns] = useState<Conn[]>([]);
  const [provider, setProvider] = useState("shopee");
  const [name, setName] = useState("");
  const [token, setToken] = useState("");

  const load = async () => {
    const res = await fetch("/api/integrations/connections?category=ecommerce");
    const json = await res.json();
    if (json.success) setConns(json.data || []);
  };
  useEffect(() => { load(); }, []);

  const connect = async () => {
    await fetch("/api/integrations/connections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider, category: "ecommerce", name: name || provider, credentials: { token } }) });
    setName(""); setToken(""); load();
  };
  const remove = async (id: number) => {
    await fetch(`/api/integrations/connections?id=${id}`, { method: "DELETE" });
    load();
  };

  return (
    <main className="p-6 md:p-12 min-h-screen bg-[#fdfaff]">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <span className="p-3 bg-violet-600 rounded-2xl shadow-xl shadow-violet-200"><Truck className="text-white w-7 h-7" /></span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">เชื่อมต่อ E-commerce</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-violet-400">Module: ecommerce_integration — Shopee, Lazada, เว็บไซต์ร้าน</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow border border-violet-50 p-6 space-y-4">
          <h2 className="font-bold text-slate-800">เพิ่มการเชื่อมต่อ</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select value={provider} onChange={(e)=>setProvider(e.target.value)} className="h-10 px-3 border border-violet-100 rounded-lg text-sm">
              {PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input placeholder="ชื่อ (optional)" value={name} onChange={(e)=>setName(e.target.value)} className="h-10 px-3 border border-violet-100 rounded-lg text-sm" />
            <input placeholder="Access Token / API Key" value={token} onChange={(e)=>setToken(e.target.value)} className="h-10 px-3 border border-violet-100 rounded-lg text-sm" />
            <button onClick={connect} className="h-10 px-4 bg-violet-600 text-white rounded-lg text-sm font-medium flex items-center gap-2"><Plus size={16}/>เชื่อมต่อ</button>
          </div>
          <p className="text-xs text-slate-400">Webhook inbound: POST /api/integrations/webhook with {"{ provider, event, order: { items: [...] } }"}</p>
        </div>

        <div className="bg-white rounded-2xl shadow border border-violet-50 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-violet-50/40">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] uppercase text-slate-400">Provider</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase text-slate-400">ชื่อ</th>
                <th className="px-4 py-3 text-center text-[10px] uppercase text-slate-400">สถานะ</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase text-slate-400">Sync ล่าสุด</th>
                <th className="px-4 py-3 text-right text-[10px] uppercase text-slate-400">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-50">
              {conns.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-slate-400">ยังไม่มีการเชื่อมต่อ</td></tr>}
              {conns.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium">{c.provider}</td>
                  <td className="px-4 py-3">{c.name}</td>
                  <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${c.status === "connected" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>{c.status}</span></td>
                  <td className="px-4 py-3 text-xs text-slate-500">{c.last_sync_at ? new Date(c.last_sync_at).toLocaleString() : "-"}</td>
                  <td className="px-4 py-3 text-right"><button onClick={()=>remove(c.id)} className="text-rose-500 text-xs font-bold hover:underline"><Trash2 size={12} className="inline" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
