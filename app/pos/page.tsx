/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
// app/pos/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { ShoppingCart, Scan, Trash2, Plus, Minus, CreditCard, Banknote, QrCode, Printer, CheckCircle2 } from "lucide-react";

type Product = { id: number; name: string; sku: string; sku_number: string; price: number; stock_quantity: number; type: string };
type CartItem = { productId: number; desc: string; sku: string; qty: number; price: number; discount: number };

export default function PosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcode, setBarcode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qr" | "card">("cash");
  const [discountTotal, setDiscountTotal] = useState(0);
  const [vatRate] = useState(7);
  const [isVatRegistered, setIsVatRegistered] = useState(true);
  const [contactId, setContactId] = useState("");
  const [contacts, setContacts] = useState<any[]>([]);
  const [branchId, setBranchId] = useState("");
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/inventory").then((r) => r.json()).then((d) => {
      if (d.success) setProducts(d.products || []);
    }).catch(() => {});
    fetch("/api/contacts").then((r) => r.json()).then((d) => {
      if (d.success) setContacts(d.data || d.contacts || []);
    }).catch(() => {});
    fetch("/api/branches").then((r) => r.json()).then((d) => {
      if (d.success) setBranches(d.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const findProduct = (code: string) => {
    const c = code.trim().toLowerCase();
    return products.find((p) =>
      String(p.sku_number || "").toLowerCase() === c ||
      String(p.sku || "").toLowerCase() === c ||
      String(p.name || "").toLowerCase() === c ||
      String(p.id) === c
    );
  };

  const addToCart = (p: Product) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.productId === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { productId: p.id, desc: p.name, sku: p.sku_number || p.sku, qty: 1, price: Number(p.price || 0), discount: 0 }];
    });
  };

  const handleBarcode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;
    const p = findProduct(barcode);
    if (p) {
      addToCart(p);
      setBarcode("");
    } else {
      setError(`ไม่พบสินค้า: ${barcode}`);
      setTimeout(() => setError(""), 2500);
      setBarcode("");
    }
  };

  const updateQty = (i: number, delta: number) => {
    setCart((prev) => prev.map((it, idx) => idx === i ? { ...it, qty: Math.max(1, it.qty + delta) } : it));
  };
  const removeItem = (i: number) => setCart((prev) => prev.filter((_, idx) => idx !== i));
  const updatePrice = (i: number, v: number) => setCart((prev) => prev.map((it, idx) => idx === i ? { ...it, price: v } : it));

  const subtotal = cart.reduce((s, it) => s + it.qty * it.price, 0);
  const net = Math.max(subtotal - discountTotal, 0);
  const vat = isVatRegistered ? (net * vatRate) / 100 : 0;
  const total = net + vat;

  const checkout = async () => {
    if (cart.length === 0) { setError("ตะกร้าว่าง"); return; }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/pos/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: contactId || null,
          branchId: branchId || null,
          items: cart.map((it) => ({ productId: it.productId, desc: it.desc, qty: it.qty, price: it.price })),
          paymentMethod,
          discountTotal,
          vatRate,
          isVatRegistered,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "ชำระเงินไม่สำเร็จ");
      setResult(json);
      setCart([]);
      setDiscountTotal(0);
      // refresh stock
      fetch("/api/inventory").then((r) => r.json()).then((d) => { if (d.success) setProducts(d.products || []); });
    } catch (e: any) {
      setError(e?.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const paymentIcon = paymentMethod === "cash" ? <Banknote size={18} /> : paymentMethod === "qr" ? <QrCode size={18} /> : <CreditCard size={18} />;

  return (
    <main className="p-4 md:p-8 min-h-screen bg-[#fdfaff]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: barcode + cart */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-violet-600 rounded-2xl shadow-xl shadow-violet-200"><ShoppingCart className="text-white w-7 h-7" /></span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">POS คิดเงินด่วน</h1>
              <p className="text-[10px] uppercase tracking-[0.3em] text-violet-400">Scan barcode / SKU / product name</p>
            </div>
          </div>

          <form onSubmit={handleBarcode} className="flex gap-2">
            <div className="relative flex-1">
              <Scan className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <input
                ref={inputRef}
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="สแกนบาร์โค้ด / SKU / ชื่อสินค้า แล้วกด Enter"
                className="w-full pl-12 pr-4 h-14 bg-white border border-violet-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-violet-50 text-sm font-medium shadow-sm"
              />
            </div>
            <button type="submit" className="h-14 px-6 bg-violet-600 text-white rounded-xl text-sm font-medium">เพิ่ม</button>
          </form>

          {error && <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-sm">{error}</div>}

          {/* quick product grid */}
          <div className="bg-white rounded-2xl shadow border border-violet-50 p-4">
            <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-3">สินค้า (คลิกเพื่อเพิ่ม)</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
              {products.slice(0, 40).map((p) => (
                <button key={p.id} onClick={() => addToCart(p)}
                  className="text-left p-3 rounded-xl border border-violet-50 hover:bg-violet-50 hover:border-violet-200 transition-all">
                  <div className="text-xs font-medium text-slate-800 truncate">{p.name}</div>
                  <div className="text-[10px] text-violet-400">{p.sku_number || p.sku}</div>
                  <div className="text-xs font-bold text-slate-900 mt-1">฿{Number(p.price).toLocaleString()}</div>
                  <div className="text-[9px] text-slate-400">คงเหลือ {p.stock_quantity ?? 0}</div>
                </button>
              ))}
            </div>
          </div>

          {/* cart */}
          <div className="bg-white rounded-2xl shadow border border-violet-50 overflow-hidden">
            <div className="px-6 py-4 border-b border-violet-50 font-bold text-slate-800">ตะกร้า ({cart.length})</div>
            <div className="divide-y divide-violet-50">
              {cart.length === 0 && <div className="py-12 text-center text-slate-400 text-sm">ยังไม่มีสินค้าในตะกร้า</div>}
              {cart.map((it, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="font-medium text-slate-800 text-sm">{it.desc}</div>
                    <div className="text-[10px] text-violet-400">{it.sku}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(i, -1)} className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center"><Minus size={14} /></button>
                    <span className="w-8 text-center font-bold">{it.qty}</span>
                    <button onClick={() => updateQty(i, 1)} className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center"><Plus size={14} /></button>
                  </div>
                  <input type="number" value={it.price} onChange={(e) => updatePrice(i, Number(e.target.value))}
                    className="w-24 h-9 px-2 border border-violet-100 rounded-lg text-sm text-right" />
                  <div className="w-24 text-right font-bold text-slate-900">฿{(it.qty * it.price).toLocaleString()}</div>
                  <button onClick={() => removeItem(i)} className="text-rose-400 hover:text-rose-600"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: totals + payment */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow border border-violet-50 p-6 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">ยอดรวม</span>
              <span className="font-bold">฿{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">ส่วนลด</span>
              <input type="number" value={discountTotal} onChange={(e) => setDiscountTotal(Number(e.target.value))}
                className="w-24 h-8 px-2 border border-violet-100 rounded-lg text-sm text-right" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">VAT {vatRate}%</span>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={isVatRegistered} onChange={(e) => setIsVatRegistered(e.target.checked)} />
                ลงทะเบียน VAT
              </label>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">VAT</span>
              <span className="font-bold">฿{vat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="border-t border-violet-100 pt-4 flex items-center justify-between">
              <span className="font-bold text-slate-900">ยอดชำระ</span>
              <span className="text-2xl font-black text-violet-600">฿{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow border border-violet-50 p-6 space-y-3">
            <div className="text-[10px] uppercase tracking-widest text-slate-400">ช่องทางชำระ</div>
            <div className="grid grid-cols-3 gap-2">
              {(["cash", "qr", "card"] as const).map((m) => (
                <button key={m} onClick={() => setPaymentMethod(m)}
                  className={`h-12 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all ${paymentMethod === m ? "bg-violet-600 text-white border-violet-600" : "bg-white text-slate-500 border-violet-100"}`}>
                  {m === "cash" ? "เงินสด" : m === "qr" ? "QR Code" : "บัตร"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              {paymentIcon} {paymentMethod === "cash" ? "เงินสด" : paymentMethod === "qr" ? "สแกน QR" : "บัตรเครดิต/เดบิต"}
            </div>

            <select value={branchId} onChange={(e) => setBranchId(e.target.value)}
              className="w-full h-10 px-3 border border-violet-100 rounded-lg text-sm">
              <option value="">สาขาหลัก (Default)</option>
              {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
            </select>
            <select value={contactId} onChange={(e) => setContactId(e.target.value)}
              className="w-full h-10 px-3 border border-violet-100 rounded-lg text-sm">
              <option value="">ลูกค้าทั่วไป (Walk-in)</option>
              {contacts.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <button onClick={checkout} disabled={loading || cart.length === 0}
              className="w-full h-14 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-xl">
              {loading ? "กำลังชำระ..." : (<>ชำระเงิน {paymentIcon}</>)}
            </button>
          </div>

          {result && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 font-bold">
                <CheckCircle2 size={20} /> ชำระเงินสำเร็จ
              </div>
              <div className="text-sm text-emerald-700">เลขที่บิล: {result.invoiceNumber}</div>
              <div className="text-sm text-emerald-700">เลขที่รับเงิน: {result.paymentNo}</div>
              <div className="text-sm text-emerald-700">ยอดรวม: ฿{Number(result.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              <button onClick={() => window.print()} className="mt-2 flex items-center gap-2 text-xs font-bold text-emerald-700 hover:underline">
                <Printer size={14} /> พิมพ์ใบเสร็จ
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
