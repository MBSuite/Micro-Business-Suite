// =====================================================
// Micro Business Suite: Company Gate (Trial -> Paid)
// อ่านสิทธิ์/โควต้าของแต่ละบริษัทจาก license_key ที่ผูกกับบริษัท
// - ถ้าบริษัทมี license_key ที่ verify ผ่าน -> ใช้ของ tier นั้น (paid)
// - ถ้าไม่มี -> อยู่ในเกณฑ์ TRIAL (จำกัดฟีเจอร์ + จำนวนธุรกรรม)
//
// ใช้โดย: API guard, server actions, banner/menu UI
// =====================================================

import { query } from "@/lib/db";
import { getUserCompanyId } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";
import {
  verifyLicenseKey,
  getSigningSalt,
  type LicensePayload,
  type LicenseType,
} from "@/lib/license";
import { getLicensePackage, type LicensePackage } from "@/lib/license-packages";

export interface CompanyGate {
  companyId: number;
  isPaid: boolean;
  trial: boolean;
  tier: LicenseType;
  package: LicensePackage;
  allowedFeatures: string[];
  maxUsers: number;
  maxTransactionsPerMonth: number;
  expiresAt: string | null;
  trialEnd: string | null;
  subscriptionStatus: string;
  licensedTo?: string;
  planTypeLabel: string;
}

const TRIAL_DAYS = 14;

export function trialEndFromNow(days: number = TRIAL_DAYS): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

async function loadCompany(companyId: number) {
  const res = await query(
    `SELECT id, name, plan_type, max_users, subscription_status,
            expiry_date, license_key, trial_end, customer_name
     FROM companies WHERE id = $1 LIMIT 1`,
    [companyId]
  );
  return res.rows[0] || null;
}

function buildTrialGate(company: Record<string, unknown> | null, companyId: number): CompanyGate {
  const pkg = getLicensePackage("TRIAL");
  const trialEndRaw = company?.trial_end ? String(company.trial_end) : null;
  return {
    companyId,
    isPaid: false,
    trial: true,
    tier: "TRIAL",
    package: pkg,
    allowedFeatures: [...pkg.defaultFeatures],
    maxUsers: Number(company?.max_users || pkg.defaultMaxUsers),
    maxTransactionsPerMonth: pkg.defaultMaxTransactionsPerMonth,
    expiresAt: null,
    trialEnd: trialEndRaw,
    subscriptionStatus: company?.subscription_status
      ? String(company.subscription_status)
      : "Active",
    planTypeLabel: pkg.label,
  };
}

export async function getCompanyGate(
  userId?: string | number | null,
  companyIdOverride?: number
): Promise<CompanyGate> {
  const companyId = companyIdOverride ?? (await getUserCompanyId(userId));
  const company = await loadCompany(companyId);

  // 0) superadmin ของระบบ = สิทธิ์เต็มอัตโนมัติ (B: owner/family bypass หมดทุก license/trial)
  //    ใช้กับบัญชี platform เอง เพื่อไม่ให้บริษัทแอดมินโดนล็อกจากการไม่มี license
  if (userId && (await isSuperAdmin(userId))) {
    const desktop = getLicensePackage("ENTERPRISE");
    return {
      companyId,
      isPaid: true,
      trial: false,
      tier: "ENTERPRISE",
      package: desktop,
      allowedFeatures: [...desktop.defaultFeatures],
      maxUsers: desktop.defaultMaxUsers,
      maxTransactionsPerMonth: desktop.defaultMaxTransactionsPerMonth,
      expiresAt: company?.expiry_date ? String(company.expiry_date) : null,
      trialEnd: company?.trial_end ? String(company.trial_end) : null,
      subscriptionStatus: "Active",
      licensedTo: company?.customer_name
        ? String(company.customer_name)
        : String(company?.name || ""),
      planTypeLabel: desktop.label,
    };
  }

  // 1) company ถูก suspend -> ยังเปิดระบบได้ แต่บอกสถานะ
  // 2) license_key ที่ผูก -> verify
  const licenseKey = company?.license_key?.trim() || null;
  if (licenseKey) {
    let payload: LicensePayload | null = null;
    try {
      const salt = getSigningSalt();
      const result = verifyLicenseKey(licenseKey, salt);
      if (result.valid && result.payload) payload = result.payload;
    } catch {
      payload = null;
    }

    if (payload) {
      const p = payload;
      const pkg = getLicensePackage(p.license_type);
      return {
        companyId,
        isPaid: true,
        trial: false,
        tier: p.license_type,
        package: pkg,
        allowedFeatures: [...(p.allowed_features || pkg.defaultFeatures)],
        maxUsers: Number(p.max_users || pkg.defaultMaxUsers),
        maxTransactionsPerMonth: Number(
          p.max_transactions_per_month || pkg.defaultMaxTransactionsPerMonth
        ),
        expiresAt: p.expires_at || null,
        trialEnd: company?.trial_end ? String(company.trial_end) : null,
        subscriptionStatus: String(company?.subscription_status || "Active"),
        licensedTo: p.licensee || (company?.customer_name ? String(company.customer_name) : undefined),
        planTypeLabel: pkg.label,
      };
    }

    // มี license_key แต่ verify ไม่ผ่าน (หมดอายุ / ลายเซ็นผิด / payload เสีย):
    // -> ล็อกบริษัทเป็น "Expired" ไม่อนุญาตให้ fallback กลับไป trial ต่อได้เรื่อย ๆ
    const tierRaw = String(company?.plan_type || "TRIAL") as LicenseType;
    const pkg = getLicensePackage(tierRaw);
    const dbStatus = String(company?.subscription_status || "Active").toLowerCase();
    return {
      companyId,
      isPaid: false,
      trial: false,
      tier: tierRaw,
      package: pkg,
      allowedFeatures: [],
      maxUsers: Number(company?.max_users || 1),
      maxTransactionsPerMonth: 0,
      expiresAt: company?.expiry_date ? String(company.expiry_date) : null,
      trialEnd: company?.trial_end ? String(company.trial_end) : null,
      subscriptionStatus: dbStatus === "suspended" ? "Suspended" : "Expired",
      licensedTo: company?.customer_name ? String(company.customer_name) : undefined,
      planTypeLabel: pkg.label,
    };
  }

  return buildTrialGate(company, companyId);
}

// สถานะ subscription ที่ห้ามบันทึกธุรกรรม/เขียนข้อมูล -> map ไปข้อความ block
const BLOCKED_SUBSCRIPTION_STATUSES: Record<string, string> = {
  suspended: "บัญชีถูกระงับการใช้งานชั่วคราว — ติดต่อทีมงาน Micro Business Suite",
  expired: "ใบอนุญาตสิ้นสุดแล้ว กรุณาติดต่อทีมงานเพื่อต่ออายุ",
  blocked: "บัญชีถูกบล็อก — ติดต่อทีมงาน Micro Business Suite",
};

// บริษัทหลักของระบบ (บริษัทแรกสุดที่ผู้ใช้เดิมทั้งหมดอยู่ร่วมกัน) ใช้ trial ไม่มีกำหนดได้โดยตั้งใจ
// ลูกค้าปกติที่ trial_end ว่าง (สร้างด้วยมือ/ข้อมูลเสีย) จะถือว่าสิ้นสุดและถูก block ใน assertCompanyQuota
async function isDefaultCompany(companyId: number): Promise<boolean> {
  const res = await query(
    `SELECT (SELECT id FROM companies ORDER BY id ASC LIMIT 1) = $1 AS is_default`,
    [companyId]
  );
  return Boolean(res.rows[0]?.is_default);
}

// นับธุรกรรมที่บันทึกจริงในเดือนปัจจุบัน (invoice + payment + quotation + expense)
// WS-3 #4: quotations/expenses มี company_id แล้ว (migration add_company_tenant_scope_quotations_expenses.sql)
// หมายเหตุ: quotations ใช้ created_at, expenses ใช้ expense_date (ไม่มีคอลัมน์ created_at ใน prod)
export async function countCompanyTransactions(companyId: number): Promise<number> {
  const res = await query(
    `
      SELECT
        (SELECT COUNT(*) FROM invoices WHERE company_id = $1 AND created_at >= date_trunc('month', now())) +
        (SELECT COUNT(*) FROM payments WHERE company_id = $1 AND created_at >= date_trunc('month', now())) +
        (SELECT COUNT(*) FROM quotations WHERE company_id = $1 AND created_at >= date_trunc('month', now())) +
        (SELECT COUNT(*) FROM expenses WHERE company_id = $1 AND expense_date >= date_trunc('month', now())::date)
        AS total
    `,
    [companyId]
  );
  return Number(res.rows[0]?.total || 0);
}

// ตรวจสิทธิ์ "บันทึกธุรกรรมใหม่" — block ถ้า suspended/expired/blocked หรือ trial เกินโควต้า
export async function assertCompanyQuota(
  userId?: string | number | null,
  companyIdOverride?: number
): Promise<{ ok: true; gate: CompanyGate } | { ok: false; error: string; gate: CompanyGate }> {
  const gate = await getCompanyGate(userId, companyIdOverride);
  const statusKey = gate.subscriptionStatus.toLowerCase();
  const blockMessage = BLOCKED_SUBSCRIPTION_STATUSES[statusKey];
  if (blockMessage) {
    return { ok: false, gate, error: blockMessage };
  }
  if (!gate.isPaid && gate.trial) {
    const used = await countCompanyTransactions(gate.companyId);
    if (used >= gate.maxTransactionsPerMonth) {
      return {
        ok: false,
        gate,
        error: `โควต้าทดลองหมดแล้ว (${used}/${gate.maxTransactionsPerMonth} รายการ/เดือน) — ติดต่อทีมงานเพื่ออัปเกรด`,
      };
    }
    // trial เกินกำหนดแล้ว — ไม่มี trial_end (นอกจากบริษัทหลัก) ถือว่าสิ้นสุดแล้วเช่นกัน
    if (!gate.trialEnd) {
      if (!(await isDefaultCompany(gate.companyId))) {
        return {
          ok: false,
          gate,
          error: "ช่วงทดลองใช้งานสิ้นสุดแล้ว — ติดต่อทีมงานเพื่อดำเนินการต่ออายุ",
        };
      }
    } else if (new Date(gate.trialEnd).getTime() < Date.now()) {
      return {
        ok: false,
        gate,
        error: "ช่วงทดลองใช้งานสิ้นสุดแล้ว — ติดต่อทีมงานเพื่อดำเนินการต่ออายุ",
      };
    }
  }
  return { ok: true, gate };
}

// ตรวจสิทธิ์ฟีเจอร์ (ยังนับ Suspended/Expired เป็นตัวถูกบล็อก เข้าถึงฟีเจอร์ไม่ได้)
export async function canAccessFeature(
  userId?: string | number | null,
  feature?: string,
  companyIdOverride?: number
): Promise<boolean> {
  const gate = await getCompanyGate(userId, companyIdOverride);
  if (!feature) return true;
  if (BLOCKED_SUBSCRIPTION_STATUSES[gate.subscriptionStatus.toLowerCase()]) return false;
  return gate.allowedFeatures.includes(feature) || gate.isPaid;
}

export async function isCompanyActive(userId?: string | number | null): Promise<boolean> {
  const gate = await getCompanyGate(userId);
  return gate.subscriptionStatus.toLowerCase() === "active";
}