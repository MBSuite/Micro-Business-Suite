// app/offline/page.tsx
import { Database } from "lucide-react";
export default function OfflinePage() {
  return (
    <main className="p-6 md:p-12 min-h-screen bg-[#fdfaff]">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <span className="p-3 bg-violet-600 rounded-2xl shadow-xl shadow-violet-200"><Database className="text-white w-7 h-7" /></span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">โหมด Offline (On-Premise sync)</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-violet-400">Module: offline_mode</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow border border-violet-50 p-8 text-center text-slate-500">
          Scaffold — ทำงานโดยไม่ใช้อินเทอร์เน็ต พร้อม sync เมื่อออนไลน์ (todo)
        </div>
      </div>
    </main>
  );
}
