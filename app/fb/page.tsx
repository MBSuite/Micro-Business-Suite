/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
// app/fb/page.tsx
"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, Plus, Send, Receipt, X, ChefHat } from "lucide-react";

type Table = { id: number; code: string; name: string; seats: number; zone: string; status: string; current_order_id: number | null };
type OrderItem = { id: number; product_id: number | null; description: string; qty: number; price: number; total: number; kot_sent: boolean };
type Order = { id: number; order_number: string; table_id: number | null; table_code: string; table_name: string; status: string; subtotal: number; vat: number; total: number; items: OrderItem[] };

export default function FbPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [newTableCode, setNewTableCode] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [qty, setQty] = useState(1);

  const loadTables = async () => {
    const res = await fetch("/api/fb/tables");
    const json = await res.json();
    if (json.success) setTables(json.data || []);
  };
  const loadProducts = async () => {
    const res = await fetch("/api/inventory");
    const json = await res.json();
    if (json.success) setProducts(json.products || []);
  };
  useEffect(() => { loadTables(); loadProducts(); }, []);

  const createTable = async () => {
    if (!newTableCode) return;
    await fetch("/api/fb/tables", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: newTableCode, name: newTableCode, seats: 4 }) });
    setNewTableCode("");
    loadTables();
  };

  const openTable = async (t: Table) => {
    setSelectedTable(t);
    if (t.current_order_id) {
      const res = await fetch(`/api/fb/orders/${t.current_order_id}`);
      const json = await res.json();
      if (json.success) setOrder(json.data);
    } else {
      // create order
      const res = await fetch("/api/fb/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ table_id: t.id }) });
      const json = await res.json();
      if (json.success) {
        setOrder({ ...json.data, items: [] });
        loadTables();
      }
    }
  };

  const addItem = async () => {
    if (!order || !selectedProduct) return;
    const p = products.find((x) => String(x.id) === selectedProduct);
    if (!p) return;
    setLoading(true);
    await fetch(`/api/fb/orders/${order.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "add_item", product_id: p.id, description: p.name, qty, price: Number(p.price || 0) }) });
    const res = await fetch(`/api/fb/orders/${order.id}`);
    const json = await res.json();
    if (json.success) setOrder(json.data);
    setQty(1);
    setLoading(false);
  };

  const removeItem = async (itemId: number) => {
    if (!order) return;
    await fetch(`/api/fb/orders/${order.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "remove_item", item_id: itemId }) });
    const res = await fetch(`/api/fb/orders/${order.id}`);
    const json = await res.json();
    if (json.success) setOrder(json.data);
  };

  const sendKot = async () => {
    if (!order) return;
    setLoading(true);
    await fetch(`/api/fb/orders/${order.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "kot" }) });
    const res = await fetch(`/api/fb/orders/${order.id}`);
    const json = await res.json();
    if (json.success) setOrder(json.data);
    setLoading(false);
    alert("ส่งออเดอร์เข้าครัว (KOT) แล้ว");
  };

  const bill = async () => {
    if (!order) return;
    await fetch(`/api/fb/orders/${order.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "bill" }) });
    const res = await fetch(`/api/fb/orders/${order.id}`);
    const json = await res.json();
    if (json.success) setOrder(json.data);
  };

  const pay = async () => {
    if (!order) return;
    await fetch(`/api/fb/orders/${order.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "pay" }) });
    setOrder(null); setSelectedTable(null); loadTables();
  };

  const cancel = async () => {
    if (!order) return;
    if (!confirm("ยกเลิกออเดอร์?")) return;
    await fetch(`/api/fb/orders/${order.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "cancel" }) });
    setOrder(null); setSelectedTable(null); loadTables();
  };

  const close = () => { setOrder(null); setSelectedTable(null); };

  const statusColor = (s: string) => s === "free" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : s === "occupied" ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-amber-50 border-amber-200 text-amber-700";

  return (
    <main className="p-4 md:p-8 min-h-screen bg-[#fdfaff]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table layout */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-violet-600 rounded-2xl shadow-xl shadow-violet-200"><ChefHat className="text-white w-7 h-7" /></span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">ร้านอาหาร/คาเฟ่ (F&B)</h1>
              <p className="text-[10px] uppercase tracking-[0.3em] text-violet-400">Module: f_and_b — ผังโต๊ะ, KOT, บิล</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow border border-violet-50 p-4 flex gap-2">
            <input placeholder="รหัสโต๊ะใหม่" value={newTableCode} onChange={(e)=>setNewTableCode(e.target.value)} className="h-10 px-3 border border-violet-100 rounded-lg text-sm flex-1" />
            <button onClick={createTable} className="h-10 px-4 bg-violet-600 text-white rounded-lg text-sm font-medium flex items-center gap-2"><Plus size={16}/>เพิ่มโต๊ะ</button>
          </div>

          <div className="bg-white rounded-2xl shadow border border-violet-50 p-6">
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              {tables.map((t) => (
                <button key={t.id} onClick={() => openTable(t)}
                  className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all hover:scale-105 ${statusColor(t.status)}`}>
                  <div className="font-black text-lg">{t.code}</div>
                  <div className="text-[10px] uppercase tracking-widest">{t.status}</div>
                  <div className="text-[9px]">{t.seats} ที่นั่ง</div>
                </button>
              ))}
              {tables.length === 0 && <div className="col-span-full py-12 text-center text-slate-400 text-sm">ยังไม่มีโต๊ะ — เพิ่มโต๊ะด้านบน</div>}
            </div>
          </div>
        </div>

        {/* Order panel */}
        <div className="space-y-4">
          {!order && <div className="bg-white rounded-2xl shadow border border-violet-50 p-8 text-center text-slate-400">เลือกโต๊ะเพื่อเปิดบิล</div>}
          {order && (
            <div className="bg-white rounded-2xl shadow border border-violet-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-violet-50 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">{order.order_number}</div>
                  <div className="text-xs text-slate-400">โต๊ะ {order.table_code} — {order.status}</div>
                </div>
                <button onClick={close} className="text-slate-400 hover:text-rose-500"><X size={18} /></button>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex gap-2">
                  <select value={selectedProduct} onChange={(e)=>setSelectedProduct(e.target.value)} className="flex-1 h-10 px-3 border border-violet-100 rounded-lg text-sm">
                    <option value="">เลือกเมนู</option>
                    {products.map((p: any) => <option key={p.id} value={p.id}>{p.name} — ฿{p.price}</option>)}
                  </select>
                  <input type="number" min={1} value={qty} onChange={(e)=>setQty(Number(e.target.value))} className="w-16 h-10 px-2 border border-violet-100 rounded-lg text-sm text-center" />
                  <button onClick={addItem} disabled={loading || !selectedProduct} className="h-10 px-3 bg-violet-600 text-white rounded-lg text-sm"><Plus size={16}/></button>
                </div>

                <div className="divide-y divide-violet-50 max-h-60 overflow-y-auto">
                  {(order.items || []).map((it) => (
                    <div key={it.id} className="py-2 flex items-center justify-between text-sm">
                      <div className="flex-1">
                        <div className="font-medium text-slate-800">{it.description}</div>
                        <div className="text-[10px] text-slate-400">{it.qty} × ฿{Number(it.price).toLocaleString()} {it.kot_sent ? "· KOT sent" : ""}</div>
                      </div>
                      <div className="font-bold text-slate-900">฿{Number(it.total).toLocaleString()}</div>
                      <button onClick={()=>removeItem(it.id)} className="ml-2 text-rose-400"><X size={14}/></button>
                    </div>
                  ))}
                  {(order.items || []).length === 0 && <div className="py-6 text-center text-slate-400 text-sm">ยังไม่มีรายการ</div>}
                </div>

                <div className="border-t border-violet-100 pt-3 space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">ยอดรวม</span><span className="font-bold">฿{Number(order.subtotal || 0).toLocaleString(undefined,{minimumFractionDigits:2})}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">VAT 7%</span><span>฿{Number(order.vat || 0).toLocaleString(undefined,{minimumFractionDigits:2})}</span></div>
                  <div className="flex justify-between font-black text-violet-600 text-lg"><span>รวม</span><span>฿{Number(order.total || 0).toLocaleString(undefined,{minimumFractionDigits:2})}</span></div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button onClick={sendKot} disabled={loading || (order.items||[]).length===0} className="h-10 bg-amber-500 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"><Send size={16}/>ส่งครัว (KOT)</button>
                  <button onClick={bill} disabled={(order.items||[]).length===0} className="h-10 bg-slate-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"><Receipt size={16}/>ออกบิล</button>
                  <button onClick={pay} disabled={order.status !== "billed"} className="h-10 bg-emerald-600 text-white rounded-lg text-sm font-bold disabled:opacity-50">ชำระเงิน</button>
                  <button onClick={cancel} className="h-10 bg-rose-500 text-white rounded-lg text-sm font-bold">ยกเลิก</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
