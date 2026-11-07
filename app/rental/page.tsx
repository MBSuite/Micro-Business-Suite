/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
"use client";

import { Briefcase } from "lucide-react";
import Link from "next/link";

export default function RentalPage() {
  return (
    <main className="p-6 md:p-10 min-h-screen bg-[#f8fafc]">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Briefcase size={28} className="text-indigo-600" />
          <h1 className="text-2xl font-black text-slate-800">Rental Suite</h1>
        </div>
        <p className="text-slate-600 mb-4">
          โมดูลธุรกิจเช่า — ทรัพย์สิน, สัญญาเช่า, ค่าเช่า, บำรุงรักษา. (scaffold)
        </p>
        <p className="text-sm text-slate-500 mb-6">
          Suite นี้เป็น standalone app ที่ sync ข้อมูลการเงิน (รายรับ/รายจ่าย) ไป MBS Core ผ่าน Bridge API
          (<code>/api/bridge/sync</code>).
        </p>
        <Link href="/" className="text-indigo-600 hover:underline text-sm">← กลับ Dashboard</Link>
      </div>
    </main>
  );
}
