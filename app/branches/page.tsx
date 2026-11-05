/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
// app/branches/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Building2, Plus, Trash2 } from "lucide-react";

type Branch = { id: number; code: string; name: string; address: string; phone: string; is_main: boolean; is_active: boolean };

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [form, setForm] = useState({ code: "", name: "", address: "", phone: "", is_main: false, is_active: true });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const res = await fetch("/api/branches");
    const json = await res.json();
    if (json.success) setBranches(json.data || []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.code || !form.name) return;
    setLoading(true);
    await fetch("/api/branches", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm({ code: "", name: "", address: "", phone: "", is_main: false, is_active: true });
    await load();
    setLoading(false);
  };

  return (
    <main className="p-6 md:p-12 min-h-screen bg-[#fdfaff]">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <span className="p-3 bg-violet-600 rounded-2xl shadow-xl shadow-violet-200"><Building2 className="text-white w-7 h-7" /></span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">หลายสาขา (Multi-Branch)</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-violet-400">Module: multi_branch</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow border border-violet-50 p-6 space-y-4">
          <h2 className="font-bold text-slate-800">เพิ่มสาขา</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input placeholder="รหัสสาขา *" value={form.code} onChange={(e)=>setForm({...form,code:e.target.value})} className="h-10 px-3 border border-violet-100 rounded-lg text-sm" />
            <input placeholder="ชื่อสาขา *" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} className="h-10 px-3 border border-violet-100 rounded-lg text-sm" />
            <input placeholder="โทรศัพท์" value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} className="h-10 px-3 border border-violet-100 rounded-lg text-sm" />
            <input placeholder="ที่อยู่" value={form.address} onChange={(e)=>setForm({...form,address:e.target.value})} className="h-10 px-3 border border-violet-100 rounded-lg text-sm md:col-span-2" />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_main} onChange={(e)=>setForm({...form,is_main:e.target.checked})} /> สาขาหลัก</label>
          </div>
          <button onClick={create} disabled={loading || !form.code || !form.name} className="h-10 px-5 bg-violet-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
            <Plus size={16} /> เพิ่มสาขา
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow border border-violet-50 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-violet-50/40">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] uppercase text-slate-400">รหัส</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase text-slate-400">ชื่อสาขา</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase text-slate-400">ที่อยู่</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase text-slate-400">โทร</th>
                <th className="px-4 py-3 text-center text-[10px] uppercase text-slate-400">หลัก</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-50">
              {branches.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-slate-400">ยังไม่มีสาขา</td></tr>}
              {branches.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-3 font-mono text-xs">{b.code}</td>
                  <td className="px-4 py-3 font-medium">{b.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{b.address || "-"}</td>
                  <td className="px-4 py-3 text-xs">{b.phone || "-"}</td>
                  <td className="px-4 py-3 text-center">{b.is_main ? "✓" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
