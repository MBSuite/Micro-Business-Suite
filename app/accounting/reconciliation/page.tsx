"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  RefreshCw,
  Scale,
  TrendingUp,
  Calendar,
  Building,
  Clock
} from "lucide-react";

interface ReconciliationItem {
  id: number;
  date: string;
  accountName: string;
  accountCode: string;
  expectedBalance: number;
  actualBalance: number;
  difference: number;
  status: "reconciled" | "unreconciled" | string;
  lastReconciled: string;
}

interface UnreconciledEntry {
  id: number;
  date: string;
  description: string;
  amount: number;
  accountName: string;
  accountCode: string;
  journalEntryId: number;
  status: string;
}

export default function ReconciliationPage() {
  const [reconciliations, setReconciliations] = useState<ReconciliationItem[]>([]);
  const [unreconciledEntries, setUnreconciledEntries] = useState<UnreconciledEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("current-month");
  const [filterStatus, setFilterStatus] = useState("all");

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/accounting/reconciliation");
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setReconciliations(Array.isArray(data.reconciliations) ? data.reconciliations : []);
      setUnreconciledEntries(Array.isArray(data.unreconciledEntries) ? data.unreconciledEntries : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load";
      console.error("Failed to load reconciliation data:", msg);
      setError("ไม่สามารถโหลดข้อมูลการตรวจสอบบัญชีได้ กรุณาลองใหม่อีกครั้ง");
      setReconciliations([]);
      setUnreconciledEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const res = await fetch("/api/accounting/reconciliation");
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        if (!ignore) {
          setReconciliations(Array.isArray(data.reconciliations) ? data.reconciliations : []);
          setUnreconciledEntries(Array.isArray(data.unreconciledEntries) ? data.unreconciledEntries : []);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Failed to load";
          console.error("Failed to load reconciliation data:", msg);
          setError("ไม่สามารถโหลดข้อมูลการตรวจสอบบัญชีได้ กรุณาลองใหม่อีกครั้ง");
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  const filteredReconciliations = reconciliations.filter((r) =>
    filterStatus === "all" ? true : r.status === filterStatus
  );

  const stats = {
    total: reconciliations.length,
    reconciled: reconciliations.filter((r) => r.status === "reconciled").length,
    unreconciled: reconciliations.filter((r) => r.status === "unreconciled").length,
    totalDifference: Math.abs(reconciliations.reduce((sum, r) => sum + (Number(r.difference) || 0), 0)),
  };

  return (
    <main className="min-h-screen bg-[#f8f5ff] p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <Link
              href="/accounting"
              className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400 transition-colors hover:text-violet-600"
            >
              <ArrowLeft size={16} /> กลับหน้าบัญชีการเงิน
            </Link>
            <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-slate-900">
              <span className="rounded-2xl bg-indigo-500 p-3 shadow-lg shadow-indigo-200">
                <Scale className="h-6 w-6 text-white" />
              </span>
              การตรวจสอบบัญชี (Reconciliation)
            </h1>
            <p className="ml-1 mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">
              Double-Entry Verification & Balance Sheet Integrity
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => refreshData()}
              disabled={loading}
              className="flex h-12 items-center gap-2 rounded-xl bg-indigo-500 px-6 text-sm font-black text-white shadow-xl shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:bg-indigo-600 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} /> ตรวจสอบใหม่
            </button>
            <button className="h-12 px-6 bg-white border border-violet-100 text-violet-600 font-medium rounded-xl flex items-center gap-3 shadow-sm hover:-translate-y-0.5 hover:bg-violet-50 transition-all">
              <FileText size={18} /> ส่งออกรายงาน
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-700 text-sm">
            <AlertCircle size={20} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Reconciliation Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="text-emerald-600" size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{stats.reconciled}</h3>
                <p className="text-sm text-slate-500">ตรวจสอบแล้วเรียบร้อย</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 uppercase tracking-wider">บัญชีที่ตรวจสอบแล้ว</p>
              <p className="text-lg font-bold text-emerald-600">
                {stats.total > 0 ? ((stats.reconciled / stats.total) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center">
                <AlertCircle className="text-amber-600" size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{stats.unreconciled}</h3>
                <p className="text-sm text-slate-500">ยังไม่ตรวจสอบ</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 uppercase tracking-wider">บัญชีที่ยังไม่ตรวจสอบ</p>
              <p className="text-lg font-bold text-amber-600">
                {stats.total > 0 ? ((stats.unreconciled / stats.total) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center">
                <TrendingUp className="text-rose-600" size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">
                  ฿{stats.totalDifference.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </h3>
                <p className="text-sm text-slate-500">ผลต่างทั้งหมด</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 uppercase tracking-wider">ยอดรวมของความต่าง</p>
              <p className="text-lg font-bold text-rose-600">รวม</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-violet-50 rounded-full flex items-center justify-center">
                <Calendar className="text-violet-600" size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{stats.total}</h3>
                <p className="text-sm text-slate-500">บัญชีทั้งหมด</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 uppercase tracking-wider">บัญชีทั้งหมด</p>
              <p className="text-lg font-bold text-violet-600">รายการ</p>
            </div>
          </div>
        </div>

        {/* 2-Block Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Block 1: Reconciliation Status */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="bg-linear-to-r from-violet-50 to-indigo-50 px-8 py-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <Scale className="text-violet-600" size={20} />
                <h2 className="text-xl font-bold text-slate-900">สถานะบัญชี</h2>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex gap-4 mb-6">
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="reconciled">ตรวจสอบแล้ว</option>
                  <option value="unreconciled">ยังไม่ตรวจสอบ</option>
                </select>
                <select 
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                >
                  <option value="current-month">เดือนปัจจุบัน</option>
                  <option value="last-quarter">ไตรมาสที่แล้ว</option>
                  <option value="fiscal-year">ปีบัญชี</option>
                </select>
              </div>

              {loading ? (
                <div className="py-12 text-center text-slate-400 text-sm">กำลังโหลดข้อมูล...</div>
              ) : filteredReconciliations.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">ไม่พบข้อมูลบัญชีสำหรับการตรวจสอบ</div>
              ) : (
                <div className="space-y-4">
                  {filteredReconciliations.map((reconciliation) => (
                    <div key={reconciliation.id} className="border border-slate-100 rounded-lg p-4 hover:border-violet-200 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Building className="text-slate-400" size={16} />
                          <div>
                            <h4 className="font-semibold text-slate-900">{reconciliation.accountName}</h4>
                            <p className="text-xs text-slate-500">รหัสบัญชี: {reconciliation.accountCode}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          reconciliation.status === "reconciled" 
                            ? "bg-emerald-100 text-emerald-700" 
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {reconciliation.status === "reconciled" ? "ตรวจสอบแล้ว" : "ยังไม่ตรวจสอบ"}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm mt-3">
                        <div>
                          <p className="text-slate-500 text-xs">ยอดตามงบ</p>
                          <p className="font-semibold text-slate-900">
                            ฿{Number(reconciliation.expectedBalance).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">ยอดจริง</p>
                          <p className="font-semibold text-slate-900">
                            ฿{Number(reconciliation.actualBalance).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">ผลต่าง</p>
                          <p className={`font-semibold ${
                            reconciliation.difference === 0 ? "text-emerald-600" : "text-rose-600"
                          }`}>
                            ฿{Number(reconciliation.difference).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3">
                        <div className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ${
                            reconciliation.difference === 0 
                              ? "bg-emerald-50 text-emerald-700" 
                              : "bg-rose-50 text-rose-700"
                          }`}>
                            {reconciliation.difference === 0 ? (
                              <>
                                <CheckCircle2 size={10} />
                                ตรงกัน
                              </>
                            ) : (
                              <>
                                <AlertCircle size={10} />
                                มีผลต่าง
                              </>
                            )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          ตรวจสอบล่าสุด: {reconciliation.lastReconciled}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Block 2: Unreconciled / Pending Entries */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="bg-linear-to-r from-violet-50 to-indigo-50 px-8 py-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <Clock className="text-indigo-600" size={20} />
                <h2 className="text-xl font-bold text-slate-900">รายการรอกระทบยอด</h2>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="py-12 text-center text-slate-400 text-sm">กำลังโหลดข้อมูล...</div>
              ) : unreconciledEntries.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                  <CheckCircle2 size={32} className="text-emerald-500" />
                  <span>ไม่มีรายการค้างรอกระทบยอด ทุกรายการสมบูรณ์</span>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {unreconciledEntries.map((entry) => (
                    <div key={entry.id} className="border border-slate-100 rounded-lg p-4 hover:border-indigo-200 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{entry.description}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                            <span>วันที่: {entry.date || "-"}</span>
                            <span>•</span>
                            <span>บัญชี: {entry.accountName} ({entry.accountCode})</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-slate-900 text-sm">
                            ฿{Number(entry.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                          </span>
                          <div className="mt-1">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              รอกระทบยอด
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="py-8 text-center opacity-30">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">
            Accounting Reconciliation - Micro-Business-Suite 2026
          </p>
        </div>
      </div>
    </main>
  );
}
