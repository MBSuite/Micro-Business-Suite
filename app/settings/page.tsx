/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
import { query } from "@/lib/db";
import SettingsClient from "@/components/SettingsClient";
import TwoFactorSettings from "@/components/TwoFactorSettings";
import { auth, getUserCompanyId } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

async function getCompanyData() {
  const session = await auth();
  if (!session?.user?.id || !(await isAdmin(session.user.id))) redirect("/");
  const companyId = await getUserCompanyId(session.user.id);
  const res = await query(
    `SELECT id, name, tax_id, phone, email, address, bank_name,
            bank_account_name, bank_account_number, bank_branch,
            vat_rate, withholding_tax_rate, is_vat_registered, currency,
            invoice_prefix, quotation_prefix, receipt_prefix, journal_prefix,
            invoice_footer, quotation_footer, receipt_footer,
            rd_client_id, rd_base_url, rd_enabled, google_drive_enabled,
            google_drive_account_email,
            (rd_client_secret IS NOT NULL AND rd_client_secret <> '') AS has_rd_client_secret,
            (rd_api_key IS NOT NULL AND rd_api_key <> '') AS has_rd_api_key
     FROM company_settings WHERE company_id = $1 LIMIT 1`,
    [companyId]
  );
  return res.rows[0] ?? null;
}

export default async function SettingsPage() {
  const company = await getCompanyData();

  return (
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-7xl mx-auto">
        
        {/* Content Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
              <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">ตั้งค่าระบบ (Settings)</h1>
              <p className="text-sm text-gray-500 mt-1">จัดการข้อมูลพื้นฐานและความปลอดภัยขององค์กร</p>
           </div>
           <div className="bg-white px-4 py-2 rounded shadow-sm border border-gray-200 text-xs font-bold text-gray-500 flex items-center gap-4">
              <span className="text-blue-600">Enterprise Edition</span>
              <span>v1.0.4</span>
           </div>
        </div>

        <SettingsClient initialData={company} />
        <TwoFactorSettings />

        <div className="text-center text-gray-400 text-xs font-medium pb-8 border-t border-gray-200 pt-6 mt-12">
           Powered by Microtronic © 2026 Microtronic Co., Ltd.
        </div>
      </div>
    </main>
  );
}
