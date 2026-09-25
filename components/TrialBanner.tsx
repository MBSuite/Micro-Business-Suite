"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, KeyRound, X } from "lucide-react";

type GateInfo = {
  trial: boolean;
  isPaid: boolean;
  tier: string;
  planTypeLabel: string;
  trialEnd: string | null;
  expiresAt: string | null;
  maxTransactionsPerMonth: number;
  maxUsers: number;
  subscriptionStatus: string;
};

export default function TrialBanner() {
  const [gate, setGate] = useState<GateInfo | null>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/me/gate")
      .then((r) => r.json())
      .then((d) => {
        const g = d?.gate || null;
        setGate(g);
        if (g?.trialEnd) {
          setDaysLeft(Math.ceil((new Date(g.trialEnd).getTime() - Date.now()) / 864e5));
        }
      })
      .catch(() => setGate(null));
  }, []);

  if (!gate || dismissed) return null;

  const status = String(gate.subscriptionStatus).toLowerCase();
  const suspended = status === "suspended";
  const expired = status === "expired";

  if (suspended) {
    return (
      <div className="bg-rose-600 text-white text-sm font-bold px-4 py-2.5 flex items-center justify-center gap-2">
        <AlertTriangle size={16} /> บัญชีถูกระงับการใช้งานชั่วคราว — ติดต่อทีมงาน Micro-Business-Suite เพื่อปลดล็อก
      </div>
    );
  }

  if (expired) {
    return (
      <div className="bg-red-700 text-white text-sm font-bold px-4 py-2.5 flex items-center justify-center gap-2">
        <KeyRound size={16} /> ใบอนุญาตสิ้นสุดแล้ว — กรุณาติดต่อทีมงาน Micro-Business-Suite เพื่อต่ออายุ
      </div>
    );
  }

  if (!gate.trial) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold px-4 py-2.5 flex items-center justify-center gap-2 relative">
      <AlertTriangle size={16} />
      <span>
        รอบทดลองใช้ฟรี {gate.planTypeLabel}
        {daysLeft !== null
          ? ` · เหลือ ${daysLeft} วัน`
          : ""}
        {" · "}จำกัด {gate.maxUsers} ผู้ใช้ / {gate.maxTransactionsPerMonth} รายการต่อเดือน — อัปเกรด หรือติดต่อทีมงานเพื่อออก license
      </span>
      <KeyRound size={16} className="hidden sm:block" />
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 p-1 hover:bg-white/20 rounded transition-colors"
        aria-label="ปิด"
      >
        <X size={16} />
      </button>
    </div>
  );
}