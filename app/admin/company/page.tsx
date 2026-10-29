/* eslint-disable @typescript-eslint/no-explicit-any */
import { getCompanySettings, updateCompanySettings } from "@/lib/settings";

export default async function CompanyProfilePage() {
  const { data } = await getCompanySettings();
  const settings = data || {
    name: "",
    company_name: "",
    tax_id: "",
    address: "",
    phone: "",
    email: "",
    logo_url: "",
  };

  return (
    <main className="p-6 md:p-10 min-h-screen bg-[#fdfaff]">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">ข้อมูลบริษัท (หัวเอกสาร)</h1>
          <p className="text-sm text-slate-500">ใช้สำหรับหัวเอกสารใบเสนอราคา ใบแจ้งหนี้ ใบเสร็จ และเอกสารภาษี</p>
        </div>

        <form action="/api/company/update" method="POST" className="bg-white rounded-3xl shadow-sm border border-violet-50 p-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="tax_id" className="text-xs font-black text-slate-600 uppercase tracking-wider">เลขที่ภาษี / Tax ID</label>
              <input id="tax_id" name="tax_id" type="text" defaultValue={settings.tax_id || ""} placeholder="010553XXXXXXXX" className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all" />
            </div>
            <div className="space-y-2">
              <label htmlFor="name" className="text-xs font-black text-slate-600 uppercase tracking-wider">ชื่อบริษัท</label>
              <input id="name" name="name" type="text" defaultValue={settings.name || settings.company_name || ""} placeholder="Micro-Business-Suite Co., Ltd." className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all" />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="address" className="text-xs font-black text-slate-600 uppercase tracking-wider">ที่อยู่</label>
            <textarea id="address" name="address" rows={3} defaultValue={settings.address || ""} placeholder="99/99 ถนนสุขุมวิท กรุงเทพฯ 10110" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all resize-none" />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-xs font-black text-slate-600 uppercase tracking-wider">เบอร์ติดต่อ</label>
              <input id="phone" name="phone" type="text" defaultValue={settings.phone || ""} placeholder="02-XXX-XXXX" className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all" />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-black text-slate-600 uppercase tracking-wider">อีเมล</label>
              <input id="email" name="email" type="email" defaultValue={settings.email || ""} placeholder="contact@company.co.th" className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all" />
            </div>
            <div className="space-y-2">
              <label htmlFor="logo_url" className="text-xs font-black text-slate-600 uppercase tracking-wider">โลโก้ (URL)</label>
              <input id="logo_url" name="logo_url" type="text" defaultValue={settings.logo_url || ""} placeholder="https://..." className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all" />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button type="submit" className="h-12 px-8 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-xl shadow-lg shadow-violet-100 transition-all text-sm">
              บันทึกข้อมูลบริษัท
            </button>
            <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">ใช้ในหัวเอกสารทุกประเภท</span>
          </div>
        </form>
      </div>
    </main>
  );
}
