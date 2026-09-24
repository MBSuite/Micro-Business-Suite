// =====================================================
// Micro Business Suite: License Tier Packages
// ที่เดียวที่นิยาม tier -> ฟีเจอร์/ลิมิต (ย้ายจาก scripts/issue-license.mjs)
// ใช้โดย: Customer Console UI, lib/company-gate.ts, gating ฟีเจอร์
// =====================================================

export type LicenseTier = "TRIAL" | "STANDARD" | "PROFESSIONAL" | "ENTERPRISE";

export interface LicensePackage {
  tier: LicenseTier;
  label: string;
  description: string;
  defaultFeatures: string[];
  defaultMaxUsers: number;
  defaultMaxTransactionsPerMonth: number;
  color: string;
}

export const LICENSE_PACKAGES: Record<LicenseTier, LicensePackage> = {
  TRIAL: {
    tier: "TRIAL",
    label: "ทดลองใช้",
    description: "ทดลองตลอด 14 วัน — ฟีเจอร์หลัก + จำกัดจำนวนธุรกรรม",
    defaultFeatures: ["basic_access", "journal_engine", "tax_reporting"],
    defaultMaxUsers: 1,
    defaultMaxTransactionsPerMonth: 30,
    color: "#6b7280",
  },
  STANDARD: {
    tier: "STANDARD",
    label: "มาตรฐาน",
    description: "ใช้งานรายเดือนสำหรับ SME เริ่มต้น",
    defaultFeatures: [
      "basic_access",
      "journal_engine",
      "tax_reporting",
      "coa_management",
    ],
    defaultMaxUsers: 3,
    defaultMaxTransactionsPerMonth: 500,
    color: "#0891b2",
  },
  PROFESSIONAL: {
    tier: "PROFESSIONAL",
    label: "มืออาชีพ",
    description: "ฟีเจอร์ครบสำหรับธุรกิจเต็มรูปแบบ",
    defaultFeatures: [
      "basic_access",
      "journal_engine",
      "advanced_reports",
      "automated_journaling",
      "coa_management",
      "tax_reporting",
    ],
    defaultMaxUsers: 5,
    defaultMaxTransactionsPerMonth: 2000,
    color: "#7c3aed",
  },
  ENTERPRISE: {
    tier: "ENTERPRISE",
    label: "องค์กร",
    description: "ไม่จำกัดผู้ใช้ + ฟีเจอร์ขั้นสูงครบทุกอย่าง",
    defaultFeatures: [
      "basic_access",
      "journal_engine",
      "advanced_reports",
      "multi_company",
      "api_access",
      "custom_branding",
      "automated_journaling",
      "coa_management",
      "tax_reporting",
    ],
    defaultMaxUsers: 20,
    defaultMaxTransactionsPerMonth: 10000,
    color: "#dc2626",
  },
};

export const LICENSE_TIERS = Object.keys(LICENSE_PACKAGES) as LicenseTier[];

export function getLicensePackage(tier?: string | null): LicensePackage {
  const key = String(tier || "").toUpperCase() as LicenseTier;
  return LICENSE_PACKAGES[key] || LICENSE_PACKAGES.TRIAL;
}

export function getDefaultFeatures(tier?: string | null): string[] {
  return getLicensePackage(tier).defaultFeatures;
}