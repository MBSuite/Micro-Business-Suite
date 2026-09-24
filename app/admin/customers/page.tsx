"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2, Copy, KeyRound, RefreshCw, PauseCircle, PlayCircle,
  History, Plus, Users, CalendarClock, AlertTriangle, TrendingUp, X,
} from "lucide-react";
import { LICENSE_PACKAGES, LICENSE_TIERS } from "@/lib/license-packages";

type Customer = {
  id: number;
  name: string;
  plan_type: string;
  max_users: number;
  subscription_status: string;
  expiry_date: string | null;
  license_key: string | null;
  trial_end: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  price_amount: number | string;
  price_currency: string;
  last_renewed_at: string | null;
  created_at: string;
  notes: string | null;
  user_count: number | string;
  event_count: number | string;
  total_paid: number | string;
};

type SubscriptionEvent = {
  id: number;
  action: string;
  license_type: string | null;
  expires_at: string | null;
  max_users: number | null;
  amount: number | null;
  notes: string | null;
  created_at: string;
};

type UserRow = {
  id: number;
  name: string | null;
  email: string;
  role: string;
  status: string | null;
  created_at: string;
};

const NEW_KEY_FEATURES = Array.from(
  new Set(Object.values(LICENSE_PACKAGES).flatMap((p) => p.defaultFeatures))
);

const ENV_HINT =
  process.env.NODE_ENV === "development" ? "local" : "production";

function fmtDate(v?: string | null): string {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("th-TH", {
    day: "2-digit", month: "short", year: "numeric",
  });
}
function fmtMoney(n: number | string | undefined | null): string {
  const num = Number(n || 0);
  return num.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function tierBadge(tier: string): string {
  const t = String(tier || "").toUpperCase();
  const color: Record<string, string> = {
    TRIAL: "bg-slate-100 text-slate-600",
    STANDARD: "bg-cyan-100 text-cyan-700",
    PROFESSIONAL: "bg-violet-100 text-violet-700",
    ENTERPRISE: "bg-rose-100 text-rose-700",
  };
  return color[t] || "bg-slate-100 text-slate-600";
}

export default function AdminCustomersPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState("");
  const [nowTs, setNowTs] = useState(0);
  const [filter, setFilter] = useState("all");

  const [licenseModal, setLicenseModal] = useState<{ mode: "ISSUE" | "RENEW"; customer?: Customer } | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [details, setDetails] = useState<{ customer: Customer; events: SubscriptionEvent[]; users: UserRow[] } | null>(null);

  const warn = (msg: string) => window.confirm(msg);

  const load = async () => {
    setLoading(true); setError(""); setNowTs(Date.now());
    try {
      const res = await fetch("/api/admin/customers");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "โหลดข้อมูลไม่สำเร็จ");
      setCustomers(data.customers || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/customers");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "โหลดข้อมูลไม่สำเร็จ");
        if (active) {
          setCustomers(data.customers || []);
          setNowTs(Date.now());
        }
      } catch (e: unknown) {
        if (active) setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const summary = useMemo(() => {
    const active = customers.filter((c) => String(c.subscription_status).toLowerCase() === "active");
    const mrr = active.reduce((s, c) => s + Number(c.price_amount || 0), 0);
    const now = nowTs;
    const plus30 = now + 30 * 864e5;
    const expiring = active.filter((c) => c.expiry_date && new Date(c.expiry_date).getTime() <= plus30 && new Date(c.expiry_date).getTime() > now);
    const overdue = active.filter((c) => c.expiry_date && new Date(c.expiry_date).getTime() < now);
    const trials = customers.filter((c) => String(c.plan_type).toUpperCase() === "TRIAL");
    return { mrr, active: active.length, expiring, overdue, trials: trials.length };
  }, [customers, nowTs]);

  const visible = useMemo(() => {
    if (filter === "paid") return customers.filter((c) => String(c.plan_type).toUpperCase() !== "TRIAL" && c.license_key);
    if (filter === "trial") return customers.filter((c) => String(c.plan_type).toUpperCase() === "TRIAL");
    if (filter === "expiring") return customers.filter((c) => c.expiry_date && new Date(c.expiry_date).getTime() <= nowTs + 30 * 864e5);
    if (filter === "suspended") return customers.filter((c) => String(c.subscription_status).toLowerCase() === "suspended");
    return customers;
  }, [customers, filter, nowTs]);

  const copyKey = async (key?: string | null) => {
    if (!key) return;
    try { await navigator.clipboard.writeText(key); alert("คัดลอก license key แล้ว"); }
    catch { prompt("คัดลอก license key:", key); }
  };

  const onToggleSuspend = async (c: Customer) => {
    const toSuspend = String(c.subscription_status).toLowerCase() !== "suspended";
    if (!warn(toSuspend ? `ระงับการใช้งานของ "${c.name}"?` : `ปลดล็อกการใช้งานของ "${c.name}"?`)) return;
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/admin/customers/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: toSuspend ? "SUSPEND" : "RESUME" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "ดำเนินการไม่สำเร็จ");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally { setSaving(false); }
  };

  const onCreateCustomer = async () => {
    const name = prompt("ชื่อบริษัทลูกค้า (create พร้อม trial 14 วัน):");
    if (!name) return;
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, plan_type: "TRIAL", max_users: 1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "สร้างไม่สำเร็จ");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally { setSaving(false); }
  };

  const openDetail = async (id: number) => {
    setDetailId(id); setDetails(null); setError("");
    try {
      const res = await fetch(`/api/admin/customers/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "โหลดรายละเอียดไม่สำเร็จ");
      setDetails(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    }
  };

  return (
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Building2 className="text-indigo-600" /> ลูกค้า & Subscription
            </h1>
            <p className="text-slate-500 text-sm mt-2">
              Customer & Subscription Console — เฉพาะผู้ดูแลระบบสูงสุด · ออก/ต่อ license key ผ่าน UI
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => load()}
              disabled={loading || saving}
              className="h-11 px-5 rounded-xl bg-slate-100 text-slate-700 text-sm font-black flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> รีโหลด
            </button>
            <button
              onClick={onCreateCustomer}
              disabled={saving}
              className="h-11 px-5 rounded-xl bg-indigo-600 text-white text-sm font-black flex items-center gap-2 disabled:opacity-50"
            >
              <Plus size={16} /> สร้างลูกค้า
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard icon={<TrendingUp className="text-emerald-600" />} label="MRR (โดยประมาณ)" value={`฿ ${fmtMoney(summary.mrr)}`} />
          <SummaryCard icon={<Building2 className="text-indigo-600" />} label="ลูกค้า Active" value={`${summary.active} ราย`} />
          <SummaryCard icon={<CalendarClock className="text-amber-600" />} label="หมดอายุใน 30 วัน" value={`${summary.expiring.length} ราย`} danger={summary.expiring.length > 0} />
          <SummaryCard icon={<AlertTriangle className={summary.overdue.length ? "text-rose-600" : "text-slate-400"} />} label="เกินกำหนด (Active)" value={`${summary.overdue.length} ราย`} danger={summary.overdue.length > 0} />
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold px-4 py-3 rounded-xl">{error}</div>
        )}

        {/* Filter chips */}
        {!loading && (
          <div className="flex gap-2 flex-wrap">
            {[
              ["all", `ทั้งหมด (${customers.length})`],
              ["paid", `มี license (${customers.filter((c) => String(c.plan_type).toUpperCase() !== "TRIAL" && c.license_key).length})`],
              ["trial", `Trial (${summary.trials})`],
              ["expiring", `ใกล้หมดอายุ (${summary.expiring.length})`],
              ["suspended", `ถูกระงับ (${customers.filter((c) => String(c.subscription_status).toLowerCase() === "suspended").length})`],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`h-9 px-4 rounded-full text-xs font-black transition-all ${filter === key ? "bg-slate-900 text-white" : "bg-white text-slate-500 border border-slate-200"}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 text-sm font-bold text-slate-500">กำลังโหลด...</div>
        ) : visible.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-sm font-bold text-slate-400">
            ไม่พบลูกค้าในหมวดนี้
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-left text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 font-black">บริษัท/ลูกค้า</th>
                    <th className="px-4 py-3 font-black">แผน/สถานะ</th>
                    <th className="px-4 py-3 font-black">ผู้ใช้</th>
                    <th className="px-4 py-3 font-black">License</th>
                    <th className="px-4 py-3 font-black">หมดอายุ/Trial</th>
                    <th className="px-4 py-3 font-black text-right">ราคา/เดือน</th>
                    <th className="px-4 py-3 font-black">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((c) => {
                    const suspended = String(c.subscription_status).toLowerCase() === "suspended";
                    const trial = String(c.plan_type).toUpperCase() === "TRIAL";
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <button onClick={() => openDetail(c.id)} className="text-left group">
                            <div className="font-black text-slate-800 group-hover:text-indigo-600">{c.name}</div>
                            <div className="text-xs text-slate-400">{c.customer_email || "—"}</div>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex w-fit px-2.5 py-0.5 rounded-full text-[11px] font-black ${tierBadge(c.plan_type)}`}>
                              {trial ? "Trial" : String(c.plan_type).toUpperCase()}
                            </span>
                            <span className={`inline-flex w-fit text-[11px] font-black items-center gap-1 ${suspended ? "text-rose-600" : "text-emerald-600"}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${suspended ? "bg-rose-500" : "bg-emerald-500"}`} />
                              {suspended ? "ถูกระงับ" : String(c.subscription_status)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-bold">{c.user_count}/{c.max_users}</td>
                        <td className="px-4 py-3">
                          {c.license_key ? (
                            <button
                              onClick={() => copyKey(c.license_key)}
                              className="flex items-center gap-2 text-xs font-black text-slate-600 hover:text-indigo-600"
                            >
                              <span className="font-mono bg-slate-100 px-2 py-1 rounded-lg">MBS...{c.license_key.slice(-6)}</span>
                              <Copy size={13} />
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 font-bold">รอออก key</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-500">
                          {trial ? <>Trial ถึง {fmtDate(c.trial_end)}</> : fmtDate(c.expiry_date)}
                          <div className="text-[10px] text-slate-400">ต่ออายุล่าสุด {fmtDate(c.last_renewed_at)}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-black text-slate-700">
                          {c.price_currency} {fmtMoney(c.price_amount)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => setLicenseModal({ mode: c.license_key ? "RENEW" : "ISSUE", customer: c })}
                              className={`h-9 px-3 rounded-lg text-xs font-black flex items-center gap-1.5 ${c.license_key ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
                            >
                              <KeyRound size={13} /> {c.license_key ? "ต่ออายุ" : "ออก key"}
                            </button>
                            <button
                              onClick={() => onToggleSuspend(c)}
                              disabled={saving}
                              className={`h-9 px-3 rounded-lg text-xs font-black flex items-center gap-1.5 ${suspended ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600"}`}
                            >
                              {suspended ? <><PlayCircle size={13} /> ปลดล็อก</> : <><PauseCircle size={13} /> ระงับ</>}
                            </button>
                            <button
                              onClick={() => openDetail(c.id)}
                              className="h-9 px-3 rounded-lg text-xs font-black text-slate-500 hover:bg-slate-100 flex items-center gap-1.5"
                            >
                              <History size={13} /> ประวัติ
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {licenseModal && (
        <LicenseModal
          customer={licenseModal.customer}
          mode={licenseModal.mode}
          onClose={() => setLicenseModal(null)}
          onSaved={async () => { setLicenseModal(null); await load(); }}
          setBusy={(b: boolean) => setSaving(b)}
          setError={(e: string) => setError(e)}
        />
      )}

      {detailId !== null && (
        <DetailModal
          customer={details?.customer || null}
          events={details?.events || []}
          users={details?.users || []}
          loading={!details}
          onClose={() => { setDetailId(null); setDetails(null); }}
          onCopyKey={copyKey}
        />
      )}
    </main>
  );
}

function SummaryCard({ icon, label, value, danger }: { icon: React.ReactNode; label: string; value: string; danger?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
        {icon} {label}
      </div>
      <div className={`text-2xl font-black mt-2 tracking-tight ${danger ? "text-rose-600" : "text-slate-900"}`}>{value}</div>
    </div>
  );
}

// ============  Modal: ออก/ต่อ license key ============
function LicenseModal({ customer, mode, onClose, onSaved, setBusy, setError }: {
  customer: Customer | undefined;
  mode: "ISSUE" | "RENEW";
  onClose: () => void;
  onSaved: () => Promise<void>;
  setBusy: (b: boolean) => void;
  setError: (e: string) => void;
}) {
  const [m, setM] = useState("subscription");
  const [tier, setTier] = useState<string>(() => {
    if (customer && String(customer.plan_type).toUpperCase() !== "TRIAL") return String(customer.plan_type).toUpperCase();
    return "PROFESSIONAL";
  });
  const [expires, setExpires] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [maxUsers, setMaxUsers] = useState("3");
  const [maxTx, setMaxTx] = useState("500");
  const [price, setPrice] = useState(customer ? String(Number(customer.price_amount || 0)) : "0");
  const [licensee, setLicensee] = useState(customer?.customer_email || customer?.customer_name || "");
  const [notes, setNotes] = useState("");
  const [features, setFeatures] = useState<string[]>(LICENSE_PACKAGES.PROFESSIONAL.defaultFeatures);
  const [busy, setBusyLocal] = useState(false);
  const [resultKey, setResultKey] = useState("");

  const handleTierChange = (t: string) => {
    setTier(t);
    if (t !== "custom") {
      const p = LICENSE_PACKAGES[t as keyof typeof LICENSE_PACKAGES];
      if (p) {
        setFeatures([...p.defaultFeatures]);
        setMaxUsers(String(p.defaultMaxUsers));
        setMaxTx(String(p.defaultMaxTransactionsPerMonth));
      }
    }
  };

  const toggleFeature = (f: string) => {
    setFeatures((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  };

  const submit = async () => {
    if (busy) return;
    if (m === "subscription" && !/^\d{4}-\d{2}-\d{2}$/.test(expires)) {
      setError("ระบุวันที่หมดอายุในรูปแบบ YYYY-MM-DD"); return;
    }
    setBusyLocal(true); setBusy(true); setError(""); setResultKey("");
    try {
      const res = await fetch(`/api/admin/customers/${customer?.id}/license`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: mode,
          mode: m,
          license_type: tier === "custom" ? "PROFESSIONAL" : tier,
          expires: m === "subscription" ? expires : undefined,
          max_users: parseInt(maxUsers, 10) || 1,
          max_transactions: parseInt(maxTx, 10) || 1,
          features,
          licensee,
          price_amount: parseFloat(price) || 0,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "ออก key ไม่สำเร็จ");
      setResultKey(data.license_key);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyLocal(false); setBusy(false);
    }
  };

  const copyResult = async () => {
    if (!resultKey) return;
    try { await navigator.clipboard.writeText(resultKey); alert("คัดลอก license key แล้ว"); }
    catch { prompt("คัดลอก license key:", resultKey); }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-900">{mode === "RENEW" ? "ต่ออายุ license" : "ออก license key"}</h2>
            <p className="text-xs text-slate-400 font-bold">{customer?.name} · ออกผ่าน UI แทน CLI</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={18} /></button>
        </div>

        {resultKey ? (
          <div className="p-6 space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm font-black text-emerald-700">
              ออก license สำเร็จ — คัดลอก key ไปส่งให้ลูกค้าได้เลย
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">License Key (เต็ม)</div>
              <div className="font-mono text-xs break-all text-slate-800">{resultKey}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={copyResult} className="h-11 flex-1 rounded-xl bg-indigo-600 text-white text-sm font-black flex items-center justify-center gap-2">
                <Copy size={16} /> คัดลอก key
              </button>
              <button onClick={onSaved} className="h-11 px-6 rounded-xl bg-slate-100 text-slate-700 text-sm font-black">
                เสร็จสิ้น
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="โหมด license">
                <select value={m} onChange={(e) => setM(e.target.value)} className="input">
                  <option value="subscription">Subscription (รายเดือน/รายปี)</option>
                  <option value="perpetual">Perpetual (ถาวร)</option>
                </select>
              </Field>
              <Field label="แผน (tier)">
                <select value={tier} onChange={(e) => handleTierChange(e.target.value)} className="input">
                  {LICENSE_TIERS.filter((t) => t !== "TRIAL").map((t) => (
                    <option key={t} value={t}>{LICENSE_PACKAGES[t].label} — {LICENSE_PACKAGES[t].defaultMaxUsers} user</option>
                  ))}
                  <option value="custom">กำหนดเอง (+ปรับฟีเจอร์/จำนวน)</option>
                </select>
              </Field>
              {m === "subscription" && (
                <Field label="หมดอายุ (YYYY-MM-DD)">
                  <input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} className="input" required />
                </Field>
              )}
              <Field label="ราคา (ต่อเดือน, THB)">
                <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="input" />
              </Field>
              <Field label="จำนวนผู้ใช้สูงสุด">
                <input type="number" min="1" value={maxUsers} onChange={(e) => setMaxUsers(e.target.value)} className="input" />
              </Field>
              <Field label="จำนวนธุรกรรม/เดือน">
                <input type="number" min="1" value={maxTx} onChange={(e) => setMaxTx(e.target.value)} className="input" />
              </Field>
              <Field label="ผู้ถือ license (licensee / email)">
                <input type="text" value={licensee} onChange={(e) => setLicensee(e.target.value)} className="input" />
              </Field>
              <Field label="หมายเหตุ">
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="เช่น เก็บเงินแล้ว เดือนแรก" className="input" />
              </Field>
            </div>

            <div>
              <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">ฟีเจอร์ที่เปิดให้ (ตามแผน {tier})</div>
              <div className="flex flex-wrap gap-2">
                {NEW_KEY_FEATURES.map((f) => (
                  <button
                    key={f}
                    onClick={() => toggleFeature(f)}
                    className={`h-9 px-3 rounded-full text-xs font-black border transition-all ${features.includes(f) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-500 border-slate-200"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={onClose} className="h-11 px-6 rounded-xl bg-slate-100 text-slate-700 text-sm font-black">ยกเลิก</button>
              <button onClick={submit} disabled={busy} className="h-11 flex-1 rounded-xl bg-emerald-600 text-white text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50">
                <KeyRound size={16} /> {busy ? "กำลังออก key..." : mode === "RENEW" ? "ต่ออายุ (ออก key ใหม่)" : "ออก license key"}
              </button>
            </div>
            <div className="text-[10px] text-slate-400 font-bold">
              โหมดใช้งานจริง: {ENV_HINT} · key ถูก sign ด้วย LICENSE_SALT เดียวกับ session ของเว็บ
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============  Modal: รายละเอียด + ประวัติ ============
function DetailModal({ customer, events, users, loading, onClose, onCopyKey }: {
  customer: Customer | null;
  events: SubscriptionEvent[];
  users: UserRow[];
  loading: boolean;
  onClose: () => void;
  onCopyKey: (k?: string | null) => void;
}) {
  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-900">{customer?.name || "กำลังโหลด..."}</h2>
            <p className="text-xs text-slate-400 font-bold">รายละเอียดและประวัติ Subscription</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-6">
          {loading && <div className="text-sm font-bold text-slate-400">กำลังโหลด...</div>}
          {customer && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <InfoCell label="อีเมล" value={customer.customer_email || "—"} />
              <InfoCell label="โทรศัพท์" value={customer.customer_phone || "—"} />
              <InfoCell label="ผู้ใช้รวม" value={`${customer.user_count}/${customer.max_users}`} />
              <InfoCell label="ราคา/เดือน" value={`${customer.price_currency} ${fmtMoney(customer.price_amount)}`} />
              <InfoCell label="ยอดชำระรวม" value={fmtMoney(customer.total_paid)} />
              <InfoCell label="สถานะ" value={String(customer.subscription_status)} />
              <InfoCell label="trial_end" value={fmtDate(customer.trial_end)} />
              <InfoCell label="หมดอายุ (paid)" value={fmtDate(customer.expiry_date)} />
              <InfoCell label="ต่ออายุครั้งล่าสุด" value={fmtDate(customer.last_renewed_at)} />
            </div>
          )}

          {customer?.license_key && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">License Key</div>
              <div className="flex items-center gap-2">
                <code className="font-mono text-xs break-all text-slate-800 flex-1">{customer.license_key}</code>
                <button onClick={() => onCopyKey(customer.license_key)} className="h-9 px-3 rounded-lg bg-indigo-600 text-white text-xs font-black flex items-center gap-1.5">
                  <Copy size={13} /> คัดลอก
                </button>
              </div>
            </div>
          )}

          {users.length > 0 && (
            <div>
              <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Users size={13} /> ผู้ใช้ในบริษัท
              </div>
              <div className="space-y-1.5 text-sm">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between border border-slate-100 rounded-lg px-3 py-2">
                    <div>
                      <div className="font-bold text-slate-700">{u.email}</div>
                      <div className="text-xs text-slate-400">{u.name} · {u.role}</div>
                    </div>
                    <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${String(u.status).toLowerCase() === "active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"} capitalize`}>
                      {String(u.status || "unknown").toLowerCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <History size={13} /> ประวัติ subscription ({events.length})
            </div>
            {events.length === 0 ? (
              <div className="text-sm text-slate-400 font-bold">ยังไม่มีประวัติ</div>
            ) : (
              <div className="space-y-2">
                {events.map((ev) => (
                  <div key={ev.id} className="border border-slate-100 rounded-xl p-3 text-sm flex items-start justify-between gap-3">
                    <div>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black mr-2 ${ev.action === "ISSUE" ? "bg-emerald-100 text-emerald-700" : ev.action === "RENEW" ? "bg-cyan-100 text-cyan-700" : ev.action === "SUSPEND" ? "bg-rose-100 text-rose-700" : ev.action === "RESUME" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                        {ev.action}
                      </span>
                      <span className="font-bold text-slate-700">{ev.license_type || "—"} · {ev.max_users ? `${ev.max_users} user` : ""}</span>
                      <div className="text-xs text-slate-400 mt-1">{ev.notes || "—"}</div>
                    </div>
                    <div className="text-right text-xs font-bold text-slate-400 shrink-0">
                      {ev.amount ? `฿ ${fmtMoney(ev.amount)}` : ""}
                      <div className="flex items-center gap-1 justify-end text-[10px]">{ev.expires_at && <><CalendarClock size={10} /> {fmtDate(ev.expires_at)}</>}</div>
                      <div>{fmtDate(ev.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-slate-100 rounded-xl px-3 py-2.5">
      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</div>
      <div className="font-bold text-slate-700 mt-0.5 break-words">{value}</div>
    </div>
  );
}