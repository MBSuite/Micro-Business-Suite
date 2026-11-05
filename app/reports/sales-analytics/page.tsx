/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
// app/reports/sales-analytics/page.tsx
"use client";

import { useEffect, useState } from "react";
import { BarChart3, Calendar, Package, TrendingUp, CreditCard, Clock } from "lucide-react";

type Data = {
  success: boolean;
  from: string;
  to: string;
  summary: { invoices: number; total: string; net: string; vat: string; discount: string; avg: string };
  daily: { day: string; invoices: number; total: string; net: string; vat: string; discount: string }[];
  monthly: { month: string; invoices: number; total: string }[];
  topProducts: { name: string; sku: string; qty: number; revenue: string }[];
  peakHours: { hour: number; invoices: number; total: string }[];
  payMethods: { method: string; count: number; total: string }[];
};

const money = (v: any) => Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

export default function SalesAnalyticsPage() {
  const today = new Date().toISOString().split("T")[0];
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
  const [from, setFrom] = useState(firstDay);
  const [to, setTo] = useState(today);
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/reports/sales-analytics?from=${from}&to=${to}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "โหลดไม่สำเร็จ");
      setData(json);
    } catch (e: any) {
      setError(e?.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <main className="p-6 md:p-12 min-h-screen bg-[#fdfaff]">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className="p-3 bg-violet-600 rounded-2xl shadow-xl shadow-violet-200">
              <BarChart3 className="text-white w-8 h-8" />
            </span>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">วิเคราะห์ยอดขาย (Sales Analytics)</h1>
              <p className="text-[10px] uppercase tracking-[0.3em] text-violet-400">Daily / Monthly / Top Products / Peak Hours</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-10 px-3 border border-violet-100 rounded-lg text-sm" />
            <span className="text-slate-400">ถึง</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-10 px-3 border border-violet-100 rounded-lg text-sm" />
            <button onClick={load} disabled={loading} className="h-10 px-5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
              {loading ? "กำลังโหลด..." : "โหลด"}
            </button>
          </div>
        </div>

        {error && <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm">{error}</div>}

        {data && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 shadow border border-violet-50">
                <div className="text-[10px] uppercase tracking-widest text-slate-400">จำนวนบิล</div>
                <div className="text-2xl font-bold text-slate-900">{data.summary.invoices}</div>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow border border-violet-50">
                <div className="text-[10px] uppercase tracking-widest text-slate-400">ยอดรวม</div>
                <div className="text-2xl font-bold text-slate-900">฿{money(data.summary.total)}</div>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow border border-violet-50">
                <div className="text-[10px] uppercase tracking-widest text-slate-400">สุทธิ</div>
                <div className="text-2xl font-bold text-slate-900">฿{money(data.summary.net)}</div>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow border border-violet-50">
                <div className="text-[10px] uppercase tracking-widest text-slate-400">เฉลี่ย/บิล</div>
                <div className="text-2xl font-bold text-slate-900">฿{money(data.summary.avg)}</div>
              </div>
            </div>

            {/* Daily table */}
            <div className="bg-white rounded-2xl shadow border border-violet-50 overflow-hidden">
              <div className="px-6 py-4 border-b border-violet-50 flex items-center gap-2">
                <Calendar size={18} className="text-violet-600" />
                <h2 className="font-bold text-slate-800">สรุปรายวัน</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-violet-50/40">
                    <tr>
                      <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-slate-400">วันที่</th>
                      <th className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-slate-400">บิล</th>
                      <th className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-slate-400">ยอดรวม</th>
                      <th className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-slate-400">สุทธิ</th>
                      <th className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-slate-400">VAT</th>
                      <th className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-slate-400">ส่วนลด</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-violet-50">
                    {data.daily.length === 0 && (
                      <tr><td colSpan={6} className="py-8 text-center text-slate-400">ไม่มีข้อมูล</td></tr>
                    )}
                    {data.daily.map((r) => (
                      <tr key={r.day} className="hover:bg-violet-50/30">
                        <td className="px-4 py-3">{r.day}</td>
                        <td className="px-4 py-3 text-right">{r.invoices}</td>
                        <td className="px-4 py-3 text-right">฿{money(r.total)}</td>
                        <td className="px-4 py-3 text-right">฿{money(r.net)}</td>
                        <td className="px-4 py-3 text-right">฿{money(r.vat)}</td>
                        <td className="px-4 py-3 text-right">฿{money(r.discount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top products */}
              <div className="bg-white rounded-2xl shadow border border-violet-50 overflow-hidden">
                <div className="px-6 py-4 border-b border-violet-50 flex items-center gap-2">
                  <Package size={18} className="text-violet-600" />
                  <h2 className="font-bold text-slate-800">สินค้าขายดี (Top 10)</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-violet-50/40">
                      <tr>
                        <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-slate-400">สินค้า</th>
                        <th className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-slate-400">จำนวน</th>
                        <th className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-slate-400">รายได้</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-violet-50">
                      {data.topProducts.length === 0 && (
                        <tr><td colSpan={3} className="py-8 text-center text-slate-400">ไม่มีข้อมูล</td></tr>
                      )}
                      {data.topProducts.map((r, i) => (
                        <tr key={i} className="hover:bg-violet-50/30">
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-800">{r.name}</div>
                            {r.sku && <div className="text-[10px] text-violet-400">{r.sku}</div>}
                          </td>
                          <td className="px-4 py-3 text-right">{r.qty}</td>
                          <td className="px-4 py-3 text-right">฿{money(r.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Peak hours */}
              <div className="bg-white rounded-2xl shadow border border-violet-50 overflow-hidden">
                <div className="px-6 py-4 border-b border-violet-50 flex items-center gap-2">
                  <Clock size={18} className="text-violet-600" />
                  <h2 className="font-bold text-slate-800">ช่วงเวลาขายดี (Peak Hours)</h2>
                </div>
                <div className="p-4 space-y-2">
                  {data.peakHours.length === 0 && <div className="py-8 text-center text-slate-400 text-sm">ไม่มีข้อมูล</div>}
                  {data.peakHours.map((r) => {
                    const max = Math.max(...data.peakHours.map((x) => x.invoices), 1);
                    const pct = (r.invoices / max) * 100;
                    return (
                      <div key={r.hour} className="flex items-center gap-3">
                        <div className="w-12 text-xs text-slate-500">{String(r.hour).padStart(2, "0")}:00</div>
                        <div className="flex-1 bg-violet-50 rounded-full h-5 overflow-hidden">
                          <div className="bg-violet-600 h-5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="w-20 text-right text-xs text-slate-600">{r.invoices} บิล</div>
                        <div className="w-24 text-right text-xs text-slate-500">฿{money(r.total)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Monthly */}
              <div className="bg-white rounded-2xl shadow border border-violet-50 overflow-hidden">
                <div className="px-6 py-4 border-b border-violet-50 flex items-center gap-2">
                  <TrendingUp size={18} className="text-violet-600" />
                  <h2 className="font-bold text-slate-800">สรุปรายเดือน</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-violet-50/40">
                      <tr>
                        <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-slate-400">เดือน</th>
                        <th className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-slate-400">บิล</th>
                        <th className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-slate-400">ยอดรวม</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-violet-50">
                      {data.monthly.length === 0 && (
                        <tr><td colSpan={3} className="py-8 text-center text-slate-400">ไม่มีข้อมูล</td></tr>
                      )}
                      {data.monthly.map((r) => (
                        <tr key={r.month} className="hover:bg-violet-50/30">
                          <td className="px-4 py-3">{r.month}</td>
                          <td className="px-4 py-3 text-right">{r.invoices}</td>
                          <td className="px-4 py-3 text-right">฿{money(r.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment methods */}
              <div className="bg-white rounded-2xl shadow border border-violet-50 overflow-hidden">
                <div className="px-6 py-4 border-b border-violet-50 flex items-center gap-2">
                  <CreditCard size={18} className="text-violet-600" />
                  <h2 className="font-bold text-slate-800">ช่องทางชำระเงิน</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-violet-50/40">
                      <tr>
                        <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-slate-400">ช่องทาง</th>
                        <th className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-slate-400">จำนวน</th>
                        <th className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-slate-400">ยอดรวม</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-violet-50">
                      {data.payMethods.length === 0 && (
                        <tr><td colSpan={3} className="py-8 text-center text-slate-400">ไม่มีข้อมูล</td></tr>
                      )}
                      {data.payMethods.map((r, i) => (
                        <tr key={i} className="hover:bg-violet-50/30">
                          <td className="px-4 py-3">{r.method}</td>
                          <td className="px-4 py-3 text-right">{r.count}</td>
                          <td className="px-4 py-3 text-right">฿{money(r.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
