/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
// app/crm/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Users, Award, History, ShoppingBag } from "lucide-react";

type Member = {
  id: number; name: string; phone: string; email: string; contact_type: string;
  account_id: number | null; tier: string | null; points_balance: number | null;
  lifetime_points: number | null; total_spent: number | null; member_since: string | null; status: string | null;
};

const tierColor: Record<string, string> = { bronze: "bg-amber-100 text-amber-700", silver: "bg-slate-100 text-slate-600", gold: "bg-yellow-100 text-yellow-700", platinum: "bg-violet-100 text-violet-700" };

export default function CrmPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const res = await fetch("/api/crm/members");
    const json = await res.json();
    if (json.success) setMembers(json.data || []);
  };
  useEffect(() => { load(); }, []);

  const openDetail = async (id: number) => {
    setSelected(id);
    setLoading(true);
    const res = await fetch(`/api/crm/members/${id}`);
    const json = await res.json();
    if (json.success) setDetail(json);
    setLoading(false);
  };

  return (
    <main className="p-6 md:p-12 min-h-screen bg-[#fdfaff]">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <span className="p-3 bg-violet-600 rounded-2xl shadow-xl shadow-violet-200"><Users className="text-white w-7 h-7" /></span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">CRM / สมาชิก / สะสมคะแนน</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-violet-400">Module: crm_loyalty — points accrual + member tier + purchase history</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Member list */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow border border-violet-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-violet-50 font-bold text-slate-800 text-sm">สมาชิก ({members.length})</div>
            <div className="divide-y divide-violet-50 max-h-[70vh] overflow-y-auto">
              {members.map((m) => (
                <button key={m.id} onClick={() => openDetail(m.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-violet-50/40 transition-all ${selected === m.id ? "bg-violet-50" : ""}`}>
                  <div className="font-medium text-slate-800 text-sm">{m.name}</div>
                  <div className="text-[10px] text-slate-400">{m.phone || m.email || "-"}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {m.tier && <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${tierColor[m.tier] || "bg-slate-100"}`}>{m.tier}</span>}
                    <span className="text-[10px] text-violet-500">{m.points_balance ?? 0} แต้ม</span>
                  </div>
                </button>
              ))}
              {members.length === 0 && <div className="py-8 text-center text-slate-400 text-sm">ยังไม่มีสมาชิก</div>}
            </div>
          </div>

          {/* Detail */}
          <div className="lg:col-span-2 space-y-4">
            {!selected && <div className="bg-white rounded-2xl shadow border border-violet-50 p-12 text-center text-slate-400">เลือกสมาชิกเพื่อดูรายละเอียด</div>}
            {loading && <div className="bg-white rounded-2xl shadow border border-violet-50 p-12 text-center text-slate-400">กำลังโหลด...</div>}
            {!loading && detail && (
              <>
                <div className="bg-white rounded-2xl shadow border border-violet-50 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Award size={20} className="text-violet-600" />
                    <h2 className="font-bold text-slate-800">{detail.account?.name || "—"}</h2>
                    {detail.account?.tier && <span className={`text-xs font-bold px-2 py-1 rounded ${tierColor[detail.account.tier]}`}>{detail.account.tier}</span>}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div><div className="text-[10px] uppercase tracking-widest text-slate-400">แต้มคงเหลือ</div><div className="text-xl font-bold text-slate-900">{detail.account?.points_balance ?? 0}</div></div>
                    <div><div className="text-[10px] uppercase tracking-widest text-slate-400">แต้มสะสมรวม</div><div className="text-xl font-bold text-slate-900">{detail.account?.lifetime_points ?? 0}</div></div>
                    <div><div className="text-[10px] uppercase tracking-widest text-slate-400">ยอดซื้อรวม</div><div className="text-xl font-bold text-slate-900">฿{Number(detail.account?.total_spent || 0).toLocaleString()}</div></div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow border border-violet-50 overflow-hidden">
                  <div className="px-6 py-4 border-b border-violet-50 flex items-center gap-2">
                    <History size={18} className="text-violet-600" />
                    <h3 className="font-bold text-slate-800">ประวัติคะแนน</h3>
                  </div>
                  <div className="overflow-x-auto max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-violet-50/40 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-[10px] uppercase text-slate-400">วันที่</th>
                          <th className="px-4 py-2 text-left text-[10px] uppercase text-slate-400">ประเภท</th>
                          <th className="px-4 py-2 text-right text-[10px] uppercase text-slate-400">แต้ม</th>
                          <th className="px-4 py-2 text-right text-[10px] uppercase text-slate-400">คงเหลือ</th>
                          <th className="px-4 py-2 text-left text-[10px] uppercase text-slate-400">รายละเอียด</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-violet-50">
                        {(detail.transactions || []).length === 0 && <tr><td colSpan={5} className="py-6 text-center text-slate-400">ไม่มีธุรกรรม</td></tr>}
                        {(detail.transactions || []).map((t: any) => (
                          <tr key={t.id}>
                            <td className="px-4 py-2 text-xs">{new Date(t.created_at).toLocaleString()}</td>
                            <td className="px-4 py-2 text-xs">{t.tx_type}</td>
                            <td className={`px-4 py-2 text-right font-bold ${t.points >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{t.points > 0 ? "+" : ""}{t.points}</td>
                            <td className="px-4 py-2 text-right">{t.balance_after}</td>
                            <td className="px-4 py-2 text-xs text-slate-500">{t.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow border border-violet-50 overflow-hidden">
                  <div className="px-6 py-4 border-b border-violet-50 flex items-center gap-2">
                    <ShoppingBag size={18} className="text-violet-600" />
                    <h3 className="font-bold text-slate-800">ประวัติการซื้อ</h3>
                  </div>
                  <div className="overflow-x-auto max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-violet-50/40 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-[10px] uppercase text-slate-400">เลขที่บิล</th>
                          <th className="px-4 py-2 text-left text-[10px] uppercase text-slate-400">วันที่</th>
                          <th className="px-4 py-2 text-right text-[10px] uppercase text-slate-400">ยอดรวม</th>
                          <th className="px-4 py-2 text-left text-[10px] uppercase text-slate-400">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-violet-50">
                        {(detail.purchases || []).length === 0 && <tr><td colSpan={4} className="py-6 text-center text-slate-400">ไม่มีการซื้อ</td></tr>}
                        {(detail.purchases || []).map((p: any) => (
                          <tr key={p.id}>
                            <td className="px-4 py-2 text-xs font-mono">{p.invoice_number}</td>
                            <td className="px-4 py-2 text-xs">{p.issue_date}</td>
                            <td className="px-4 py-2 text-right">฿{Number(p.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td className="px-4 py-2 text-xs">{p.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
