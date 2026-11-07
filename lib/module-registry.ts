/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
export type AppModule = {
  id: string;
  label: string;
  icon: string;
  category:
    | "sales"
    | "operations"
    | "master_data"
    | "reports"
    | "admin";
  route?: string;
  requiresAdmin?: boolean;
  superadminOnly?: boolean;
  enabledByDefault?: boolean;
  core?: boolean; // true = part of MBSuite core (cannot be disabled)
  description?: string;
};

export const MODULE_REGISTRY: AppModule[] = [
  // ==================== SALES ====================
  { id: "quotations", label: "ใบเสนอราคา (QT)", icon: "fileText", category: "sales", route: "/quotations", enabledByDefault: true, core: true },
  { id: "invoices", label: "ใบแจ้งหนี้ (INV)", icon: "receipt", category: "sales", route: "/invoices", enabledByDefault: true, core: true },
  { id: "recurring", label: "รอบบิลอัตโนมัติ", icon: "repeat", category: "sales", route: "/recurring", enabledByDefault: true, core: true },
  { id: "receipts", label: "ใบเสร็จรับเงิน", icon: "creditCard", category: "sales", route: "/receipts", enabledByDefault: true, core: true },

  // ==================== PLUGIN MODULES (installable packs) ====================
  // ติดตั้งเพิ่มต่อ company ผ่าน /admin/modules หรือ /admin/plugins
  { id: "pos_checkout", label: "POS คิดเงิน/สแกนบาร์โค้ด", icon: "shoppingCart", category: "sales", route: "/pos", enabledByDefault: false, core: false, description: "เครื่องคิดเงินด่วน: สแกนบาร์โค้ด, ตะกร้า, ชำระหลายรูปแบบ, ตัดสต็อก" },
  { id: "promotions", label: "โปรโมชัน/ส่วนลด", icon: "barChart", category: "sales", route: "/promotions", enabledByDefault: false, core: false, description: "จัดการโปรโมชัน, คูปอง, ส่วนลดตามเงื่อนไข" },
  { id: "sales_analytics", label: "วิเคราะห์ยอดขาย (Analytics)", icon: "barChart", category: "sales", route: "/reports/sales-analytics", enabledByDefault: true, core: false, description: "สรุปรายวัน/รายเดือน, สินค้าขายดี, ช่วงเวลาขายดี" },
  { id: "crm_loyalty", label: "CRM/สะสมคะแนน/สมาชิก", icon: "users", category: "sales", route: "/crm", enabledByDefault: false, core: false, description: "ประวัติการซื้อ, สะสมคะแนน, สิทธิ์สมาชิก" },
  { id: "employee_sales", label: "ยอดขายรายพนักงาน", icon: "userCog", category: "sales", route: "/reports/employee-sales", enabledByDefault: false, core: false, description: "ประวัติและยอดขายแยกตามพนักงาน" },
  { id: "f_and_b", label: "ร้านอาหาร/คาเฟ่ (F&B)", icon: "shoppingCart", category: "operations", route: "/fb", enabledByDefault: false, core: false, description: "ผังโต๊ะ, เปิด/รวมบิล, KOT, ส่วนประกอบเมนู" },
  { id: "hotel_booking", label: "จองห้องพัก (Hotel/Booking)", icon: "building2", category: "operations", route: "/hotel", enabledByDefault: false, core: false, description: "ห้อง, การจอง, check-in/out, แม่บ้าน" },
  { id: "rental", label: "ธุรกิจเช่า (Rental)", icon: "briefcase", category: "operations", route: "/rental", enabledByDefault: false, core: false, description: "ทรัพย์สิน, สัญญาเช่า, ค่าเช่า, บำรุงรักษา" },
  { id: "pharmacy", label: "ร้านขายยา (Pharmacy)", icon: "package", category: "master_data", route: "/pharmacy", enabledByDefault: false, core: false, description: "ใบสั่งยา, สต็อกยา, หมดอายุ" },  { id: "ecommerce_integration", label: "เชื่อมต่อ E-commerce", icon: "truck", category: "operations", route: "/integrations/ecommerce", enabledByDefault: false, core: false, description: "Shopee, Lazada, เว็บไซต์ร้าน" },
  { id: "delivery_integration", label: "เชื่อมต่อ Delivery", icon: "truck", category: "operations", route: "/integrations/delivery", enabledByDefault: false, core: false, description: "GrabFood, LINE MAN, Foodpanda" },
  { id: "multi_branch", label: "หลายสาขา", icon: "building2", category: "master_data", route: "/branches", enabledByDefault: false, core: false, description: "จัดการสาขาและสต็อกแยกสาขา" },
  { id: "inventory_variants", label: "สต็อกแยกสี/ไซส์/ประเภท", icon: "package", category: "master_data", route: "/inventory/variants", enabledByDefault: false, core: false, description: "ติดตามสต็อกแยกตามสี ไซส์ ประเภท" },
  { id: "pharmacy", label: "ร้านขายยา (Pharmacy)", icon: "package", category: "master_data", route: "/pharmacy", enabledByDefault: false, core: false, description: "ใบสั่งยา, สต็อกยา, หมดอายุ" },  { id: "offline_mode", label: "โหมด Offline (On-Premise)", icon: "database", category: "operations", route: "/offline", enabledByDefault: false, core: false, description: "ทำงานโดยไม่ใช้อินเทอร์เน็ต + sync" },

  // ==================== OPERATIONS ====================
  { id: "expenses", label: "ค่าใช้จ่าย/ซัพพลายเออร์", icon: "wallet", category: "operations", route: "/expenses", enabledByDefault: true, core: true },
  { id: "payroll", label: "ค่าแรงพนง", icon: "banknote", category: "operations", route: "/payroll", enabledByDefault: true, core: true },
  { id: "vouchers", label: "ใบสำคัญจ่าย", icon: "banknote", category: "operations", route: "/vouchers", enabledByDefault: true, core: true },
  { id: "journals", label: "สมุดรายวัน (Journals)", icon: "library", category: "operations", route: "/journals", enabledByDefault: true, core: true },
  { id: "bank_reconcile", label: "กระทบยอดธนาคาร (AI)", icon: "checkCircle", category: "operations", route: "/bank-reconcile", enabledByDefault: true, core: true },
  { id: "mrp", label: "การผลิต (MRP)", icon: "factory", category: "operations", route: "/mrp", enabledByDefault: true, core: true },

  // ==================== MASTER DATA ====================
  { id: "inventory", label: "คลังสินค้า (Stock)", icon: "package", category: "master_data", route: "/inventory", enabledByDefault: true, core: true },
  { id: "services", label: "ราคากลางบริการ (Services)", icon: "briefcase", category: "master_data", route: "/services", enabledByDefault: true, core: true },
  { id: "coa", label: "ผังบัญชี (COA)", icon: "pieChart", category: "master_data", route: "/admin/coa", enabledByDefault: true, core: true },
  { id: "contacts", label: "ผู้ติดต่อ / คู่ค้า (Contacts)", icon: "users", category: "master_data", route: "/contacts", enabledByDefault: true, core: true },
  { id: "custom_forms", label: "ปรับแต่งฟอร์ม/รายงาน", icon: "fileEdit", category: "master_data", route: "/custom-forms", enabledByDefault: true, core: true },

  // ==================== REPORTS ====================
  { id: "tax_reports", label: "รายงานภาษี", icon: "fileText", category: "reports", route: "/tax-reports", enabledByDefault: true, core: true },
  { id: "reports", label: "งบกำไรขาดทุน (P&L)", icon: "barChart", category: "reports", route: "/reports/profit-loss", enabledByDefault: true, core: true },
  { id: "cash_flow", label: "กระแสเงินสด (Cash Flow)", icon: "trendingUp", category: "reports", route: "/cash-flow", enabledByDefault: true, core: true },

  // ==================== ADMIN ====================
  { id: "member_management", label: "จัดการสมาชิก", icon: "userCog", category: "admin", route: "/admin/members", requiresAdmin: true, enabledByDefault: true, core: true },
  { id: "groups", label: "จัดการกลุ่ม/สิทธิ์", icon: "shieldCheck", category: "admin", route: "/admin/groups", requiresAdmin: true, enabledByDefault: true, core: true },
  { id: "modules_control", label: "โมดูล/ตั้งค่า", icon: "settings", category: "admin", route: "/admin/modules", requiresAdmin: true, enabledByDefault: true, core: true },
  { id: "backup", label: "Database Backup", icon: "database", category: "admin", route: "/admin/backup", requiresAdmin: true, enabledByDefault: true, core: true },
  { id: "customer_console", label: "ลูกค้า & Subscription", icon: "building2", category: "admin", route: "/admin/customers", requiresAdmin: true, superadminOnly: true, enabledByDefault: true, core: true, description: "Customer & Subscription Console — เฉพาะ superadmin" },
  { id: "company_profile", label: "ข้อมูลบริษัท (หัวเอกสาร)", icon: "building", category: "admin", route: "/admin/company", requiresAdmin: true, enabledByDefault: true, core: true, description: "เลขที่ภาษี, ชื่อบริษัท, ที่อยู่, โทรศัพท์, อีเมล, โลโก้ — ใช้ทำหัวเอกสาร" },
  { id: "plugin_manager", label: "จัดการปลักอิน/Add-on", icon: "settings", category: "admin", route: "/admin/plugins", requiresAdmin: true, enabledByDefault: true, core: true, description: "ติดตั้ง/ถอนการติดตั้ง โมดูล ปลักอิน extension ต่อ company" },
];

export const MODULE_CATEGORIES: Array<{ id: AppModule["category"]; label: string }> = [
  { id: "sales", label: "SALES" },
  { id: "operations", label: "OPERATIONS" },
  { id: "master_data", label: "MASTER DATA" },
  { id: "reports", label: "REPORTS" },
  { id: "admin", label: "ADMIN" },
];

function isEnabledByEnv(moduleId: string, fallback: boolean): boolean {
  const envKey = `NEXT_PUBLIC_MODULE_${moduleId.toUpperCase()}`;
  const value = process.env[envKey];
  if (!value) return fallback;
  return value === "1" || value.toLowerCase() === "true";
}

export function getEnabledModules() {
  return MODULE_REGISTRY.filter((mod) => isEnabledByEnv(mod.id, mod.enabledByDefault !== false));
}

export function applyModuleOverrides(
  baseModules: AppModule[],
  overrides: Record<string, boolean>
) {
  return baseModules.filter((mod) => {
    const override = overrides[mod.id];
    if (typeof override === "boolean") return override;
    return true;
  });
}

export function getPermissionModules() {
  return MODULE_REGISTRY.filter((mod) => mod.category !== "admin" && mod.id !== "backup" && !mod.id.startsWith("journals_"))
    .map((mod) => ({
      id: mod.id,
      name: mod.label,
      icon: mod.icon,
    }));
}

