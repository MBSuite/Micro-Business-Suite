// lib/plugin-packs.ts
// =====================================================
// Micro Business Suite: Installable Plugin Packs
// กลุ่ม module ที่ติดตั้งพร้อมกันสำหรับกลุ่มลูกค้าต่างกัน
// (Retail / F&B / Pharmacy / Service / E-commerce / ...)
// แต่ละ pack = ชุด module ids + metadata + tier ขั้นต่ำ
// ใช้ร่วมกับ lib/module-registry.ts + company_module_settings
// =====================================================

export type PluginPackId =
  | "retail_pos"
  | "sales_analytics"
  | "crm_loyalty"
  | "multi_branch"
  | "inventory_variants"
  | "employee_sales"
  | "f_and_b"
  | "ecommerce_integration"
  | "delivery_integration"
  | "offline_mode"
  | "pharmacy"
  | "service_business"
  | "hotel_booking"
  | "rental";
export interface PluginPack {
  id: PluginPackId;
  name: string;
  description: string;
  targetCustomers: string[];
  modules: string[]; // module ids from MODULE_REGISTRY
  minTier: "TRIAL" | "STANDARD" | "PROFESSIONAL" | "ENTERPRISE";
  dependencies?: PluginPackId[];
  icon: string;
  color: string;
}

export const PLUGIN_PACKS: Record<PluginPackId, PluginPack> = {
  retail_pos: {
    id: "retail_pos",
    name: "Retail POS (คิดเงิน/สแกนบาร์โค้ด)",
    description: "เครื่องคิดเงินด่วนสำหรับร้านค้าปลีก: สแกนบาร์โค้ด, ตะกร้า, ชำระหลายรูปแบบ, ตัดสต็อกอัตโนมัติ",
    targetCustomers: ["ร้านค้าปลีก", "มินิมาร์ท", "ร้านสะดวกซื้อ", "ร้านขายยา"],
    modules: ["pos_checkout", "promotions", "inventory_variants"],
    minTier: "STANDARD",
    icon: "shoppingCart",
    color: "#7c3aed",
  },
  sales_analytics: {
    id: "sales_analytics",
    name: "Sales Analytics (วิเคราะห์ยอดขาย)",
    description: "สรุปรายวัน/รายเดือน, สินค้าขายดี, ช่วงเวลาขายดี เพื่อวางแผนสต็อก/การตลาด",
    targetCustomers: ["ทุกกลุ่ม"],
    modules: ["sales_analytics"],
    minTier: "STANDARD",
    icon: "barChart",
    color: "#0891b2",
  },
  crm_loyalty: {
    id: "crm_loyalty",
    name: "CRM & Loyalty (สมาชิก/สะสมคะแนน)",
    description: "บันทึกประวัติการซื้อ, สะสมคะแนน, สิทธิประโยชน์เฉพาะสมาชิก",
    targetCustomers: ["ร้านค้าปลีก", "F&B", "ร้านเสริมสวย"],
    modules: ["crm_loyalty"],
    minTier: "PROFESSIONAL",
    icon: "users",
    color: "#dc2626",
  },
  multi_branch: {
    id: "multi_branch",
    name: "Multi-Branch (หลายสาขา)",
    description: "จัดการสาขาและสต็อกแยกสาขา ตัดสต็อกได้หลายสาขา",
    targetCustomers: ["เชนร้าน", "แฟรนไชส์"],
    modules: ["multi_branch", "inventory_variants"],
    minTier: "PROFESSIONAL",
    icon: "building2",
    color: "#059669",
  },
  inventory_variants: {
    id: "inventory_variants",
    name: "Variant Inventory (สี/ไซส์/ประเภท)",
    description: "ติดตามสินค้าคงเหลือแยกตามประเภท/สี/ไซส์ + แจ้งเตือนใกล้หมด",
    targetCustomers: ["เสื้อผ้า", "รองเท้า", "ร้านค้าปลีก"],
    modules: ["inventory_variants"],
    minTier: "STANDARD",
    icon: "package",
    color: "#d97706",
  },
  employee_sales: {
    id: "employee_sales",
    name: "Employee Sales (ยอดขายรายพนักงาน)",
    description: "ประวัติบันทึกการทำงานและยอดขายรายคน กำหนดสิทธิ์ตามตำแหน่ง",
    targetCustomers: ["ทุกกลุ่มที่มีพนักงาน"],
    modules: ["employee_sales"],
    minTier: "STANDARD",
    icon: "userCog",
    color: "#6366f1",
  },
  f_and_b: {
    id: "f_and_b",
    name: "F&B (ร้านอาหาร/คาเฟ่)",
    description: "ผังโต๊ะ, เปิด/รวมบิล, ส่งออเดอร์เข้าครัว (KOT), แยกส่วนประกอบเมนู",
    targetCustomers: ["ร้านอาหาร", "คาเฟ่", "ร้านกาแฟ", "บาร์"],
    modules: ["f_and_b", "pos_checkout", "inventory_variants"],
    minTier: "PROFESSIONAL",
    dependencies: ["retail_pos"],
    icon: "shoppingCart",
    color: "#ea580c",
  },
  ecommerce_integration: {
    id: "ecommerce_integration",
    name: "E-commerce Integration",
    description: "เชื่อมต่อ Shopee, Lazada, เว็บไซต์ร้าน — sync สต็อก/ออเดอร์",
    targetCustomers: ["ร้านค้าออนไลน์", "Omnichannel"],
    modules: ["ecommerce_integration"],
    minTier: "PROFESSIONAL",
    icon: "truck",
    color: "#0284c7",
  },
  delivery_integration: {
    id: "delivery_integration",
    name: "Delivery Integration",
    description: "เชื่อมต่อแพลตฟอร์ม Delivery (GrabFood, LINE MAN, Foodpanda)",
    targetCustomers: ["F&B", "ร้านอาหาร"],
    modules: ["delivery_integration"],
    minTier: "PROFESSIONAL",
    dependencies: ["f_and_b"],
    icon: "truck",
    color: "#16a34a",
  },
  offline_mode: {
    id: "offline_mode",
    name: "Offline Mode (On-Premise sync)",
    description: "ทำงานโดยไม่ใช้อินเทอร์เน็ต พร้อม sync เมื่อออนไลน์",
    targetCustomers: ["ร้านที่เน็ตไม่เสถียร", "On-Premise"],
    modules: ["offline_mode"],
    minTier: "ENTERPRISE",
    icon: "database",
    color: "#475569",
  },
  pharmacy: {
    id: "pharmacy",
    name: "Pharmacy (ร้านขายยา)",
    description: "POS + สต็อกยา + แจ้งเตือนหมดอายุ + ใบสั่งแพทย์ (scaffold)",
    targetCustomers: ["ร้านขายยา", "คลินิก"],
    modules: ["pos_checkout", "inventory_variants", "crm_loyalty"],
    minTier: "PROFESSIONAL",
    dependencies: ["retail_pos"],
    icon: "package",
    color: "#0d9488",
  },
  service_business: {
    id: "service_business",
    name: "Service Business (บริการ)",
    description: "จัดการบริการ, นัดหมาย, ใบแจ้งหนี้บริการ",
    targetCustomers: ["ร้านเสริมสวย", "สปา", "คลินิก"],
    modules: ["crm_loyalty", "employee_sales"],
    minTier: "STANDARD",
    icon: "briefcase",
    color: "#a855f7",
  },
  hotel_booking: {
    id: "hotel_booking",
    name: "Hotel/Booking (จองห้องพัก)",
    description: "จัดการห้อง, การจอง, check-in/out, แม่บ้าน",
    targetCustomers: ["โรงแรม", "เกสต์เฮาส์", "โฮมสเตย์"],
    modules: ["hotel_booking"],
    minTier: "PROFESSIONAL",
    icon: "building2",
    color: "#2563eb",
  },
  rental: {
    id: "rental",
    name: "Rental (ธุรกิจเช่า)",
    description: "จัดการทรัพย์สิน, สัญญาเช่า, ค่าเช่า, บำรุงรักษา",
    targetCustomers: ["เช่าอพาร์ทเมนท์", "เช่ารถ", "เช่าอุปกรณ์"],
    modules: ["rental"],
    minTier: "STANDARD",
    icon: "briefcase",
    color: "#ea580c",
  },
};

export function getPluginPack(id: PluginPackId): PluginPack | undefined {
  return PLUGIN_PACKS[id];
}

export function listPluginPacks(): PluginPack[] {
  return Object.values(PLUGIN_PACKS);
}

export function getModulesForPack(id: PluginPackId): string[] {
  return PLUGIN_PACKS[id]?.modules || [];
}

export function getPacksForModule(moduleId: string): PluginPack[] {
  return Object.values(PLUGIN_PACKS).filter((p) => p.modules.includes(moduleId));
}
