/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
// app/promotions/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Tag, Plus, Trash2, Save } from "lucide-react";

type Promo = {
  id: number; code: string | null; name: string; description: string | null;
  promo_type: string; value: number; min_purchase: number; max_discount: number | null;
  applies_to: string; applies_ids: string | null; starts_at: string | null; ends_at: string | null;
  usage_limit: number | null; usage_count: number; is_active: boolean;
};

const empty = { code: "", name: "", description: "", promo_type: "percentage", value: 0, min_purchase: 0, max_discount: "", applies_to: "all", applies_ids: "", starts_at: "", ends_at: "", usage_limit: "", is_active: true };

export default function PromotionsPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [form, setForm] = useState<any>(empty);
  const [editing, setEditing] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const res = await fetch("/api/promotions");
    const json = await res.json();
    if (json.success) setPromos(json.data || []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setLoading(true); setError("");
    try {
      const url = editing ? `/api/promotions/${editing}` : "/api/promotions";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "บันทึกไม่สำเร็จ");
      setForm(empty); setEditing(null); load();
    } catch (e: any) { setError(e?.message); }
    finally { setLoading(false); }
  };

  const remove = async (id: number) => {
    if (!confirm("ลบโปรโมชันนี้?")) return;
    await fetch(`/api/promotions/${id}`, { method: "DELETE" });
    load();
  };

  const startEdit = (p: Promo) => {
    setEditing(p.id);
    setForm({ ...p, max_discount: p.max_discount ?? "", usage_limit: p.usage_limit ?? "", starts_at: p.starts_at ? p.starts_at.slice(0,16) : "", ends_at: p.ends_at ? p.ends_at.slice(0,16) : "" });
  };

  return (
    <main className="p-6 md:p-12 min-h-screen bg-[#fdfaff]">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <span className="p-3 bg-violet-600 rounded-2xl shadow-xl shadow-violet-200"><Tag className="text-white w-7 h-7" /></span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">โปรโมชัน/ส่วนลด</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-violet-400">Promotions Rules Engine — Module: promotions</p>
          </div>
        </div>

        {error && <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-sm">{error}</div>}

        {/* Form */}
        <div className="bg-white rounded-2xl shadow border border-violet-50 p-6 space-y-4">
          <h2 className="font-bold text-slate-800">{editing ? "แก้ไขโปรโมชัน" : "สร้างโปรโมชันใหม่"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input placeholder="โค้ด (optional)" value={form.code} onChange={(e)=>setForm({...form,code:e.target.value})} className="h-10 px-3 border border-violet-100 rounded-lg text-sm" />
            <input placeholder="ชื่อโปรโมชัน *" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} className="h-10 px-3 border border-violet-100 rounded-lg text-sm" />
            <select value={form.promo_type} onChange={(e)=>setForm({...form,promo_type:e.target.value})} className="h-10 px-3 border border-violet-100 rounded-lg text-sm">
              <option value="percentage">เปอร์เซ็นต์ (%)</option>
              <option value="fixed">จำนวนเงิน (฿)</option>
              <option value="bogo">ซื้อ 1 แถม 1</option>
              <option value="bundle">Bundle</option>
            </select>
            <input type="number" placeholder="ค่า (value)" value={form.value} onChange={(e)=>setForm({...form,value:Number(e.target.value)})} className="h-10 px-3 border border-violet-100 rounded-lg text-sm" />
            <input type="number" placeholder="ยอดขั้นต่ำ" value={form.min_purchase} onChange={(e)=>setForm({...form,min_purchase:Number(e.target.value)})} className="h-10 px-3 border border-violet-100 rounded-lg text-sm" />
            <input type="number" placeholder="ส่วนลดสูงสุด (cap)" value={form.max_discount} onChange={(e)=>setForm({...form,max_discount:e.target.value})} className="h-10 px-3 border border-violet-100 rounded-lg text-sm" />
            <select value={form.applies_to} onChange={(e)=>setForm({...form,applies_to:e.target.value})} className="h-10 px-3 border border-violet-100 rounded-lg text-sm">
              <option value="all">ทั้งหมด</option>
              <option value="products">สินค้าเฉพาะ</option>
              <option value="categories">หมวดหมู่เฉพาะ</option>
            </select>
            <input placeholder="IDs (comma)" value={form.applies_ids} onChange={(e)=>setForm({...form,applies_ids:e.target.value})} className="h-10 px-3 border border-violet-100 rounded-lg text-sm" />
            <input type="number" placeholder="จำกัดจำนวนใช้" value={form.usage_limit} onChange={(e)=>setForm({...form,usage_limit:e.target.value})} className="h-10 px-3 border border-violet-100 rounded-lg text-sm" />
            <input type="datetime-local" value={form.starts_at} onChange={(e)=>setForm({...form,starts_at:e.target.value})} className="h-10 px-3 border border-violet-100 rounded-lg text-sm" />
            <input type="datetime-local" value={form.ends_at} onChange={(e)=>setForm({...form,ends_at:e.target.value})} className="h-10 px-3 border border-violet-100 rounded-lg text-sm" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active} onChange={(e)=>setForm({...form,is_active:e.target.checked})} /> เปิดใช้งาน
            </label>
          </div>
          <textarea placeholder="คำอธิบาย" value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} className="w-full px-3 py-2 border border-violet-100 rounded-lg text-sm" rows={2} />
          <div className="flex gap-2">
            <button onClick={save} disabled={loading || !form.name} className="h-10 px-5 bg-violet-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
              <Save size={16} /> {loading ? "กำลังบันทึก..." : (editing ? "อัปเดต" : "สร้าง")}
            </button>
            {editing && <button onClick={()=>{setEditing(null);setForm(empty);}} className="h-10 px-5 bg-slate-100 text-slate-600 rounded-lg text-sm">ยกเลิก</button>}
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl shadow border border-violet-50 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-violet-50/40">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-slate-400">โค้ด</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-slate-400">ชื่อ</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-slate-400">ประเภท</th>
                <th className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-slate-400">ค่า</th>
                <th className="px-4 py-3 text-center text-[10px] uppercase tracking-widest text-slate-400">ใช้แล้ว</th>
                <th className="px-4 py-3 text-center text-[10px] uppercase tracking-widest text-slate-400">สถานะ</th>
                <th className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-slate-400">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-50">
              {promos.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-slate-400">ยังไม่มีโปรโมชัน</td></tr>}
              {promos.map((p) => (
                <tr key={p.id} className="hover:bg-violet-50/30">
                  <td className="px-4 py-3 font-mono text-xs">{p.code || "-"}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                  <td className="px-4 py-3 text-xs">{p.promo_type}</td>
                  <td className="px-4 py-3 text-right">{p.value}</td>
                  <td className="px-4 py-3 text-center">{p.usage_count}{p.usage_limit ? `/${p.usage_limit}` : ""}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${p.is_active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>{p.is_active ? "เปิด" : "ปิด"}</span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={()=>startEdit(p)} className="text-violet-600 text-xs font-bold hover:underline">แก้ไข</button>
                    <button onClick={()=>remove(p.id)} className="text-rose-500 text-xs font-bold hover:underline"><Trash2 size={12} className="inline" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
