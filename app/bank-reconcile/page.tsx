export default function BankReconcilePage() {
  return (
    <main className="p-6 md:p-10 min-h-screen bg-[#fdfaff]">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-black text-slate-900">กระทบยอดธนาคาร (AI Bank Reconcile)</h1>
        <div className="bg-white rounded-3xl shadow-sm border border-violet-50 p-8 space-y-4">
          <p className="text-slate-600">โครงสร้างพื้นฐาน — รับไฟล์ธนาคาร (CSV/Excel) และเปรียบเทียบกับรายการในระบบ</p>
          <p className="text-xs text-slate-400">API: POST /api/bank-reconcile</p>
        </div>
      </div>
    </main>
  );
}
