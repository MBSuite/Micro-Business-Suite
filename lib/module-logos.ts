// lib/module-logos.ts
// =====================================================
// ศูนย์กลางโลโก้ของ 6 โมดูลธุรกิจ (Service, Retail, Rental, Pharmacy, Hotel, F&B)
// ไฟล์ภาพจริงอยู่ใน public/ — ทุกจุดใน UI ต้องดึงผ่าน mapping นี้เท่านั้น
// เพื่อไม่ให้ path/ชื่อไฟล์กระจายอยู่หลายที่ (เปลี่ยนโลโก้ที่เดียวจบ)
// =====================================================

export type ModuleBrandKey =
  | "service_business"
  | "retail"
  | "rental"
  | "pharmacy"
  | "hotel_booking"
  | "f_and_b";

export type ModuleBrand = {
  /** module id ที่ใช้ใน MODULE_REGISTRY / PLUGIN_PACKS */
  key: ModuleBrandKey;
  /** ชื่อทางการของโมดูล */
  name: string;
  /** ป้ายภาษาไทยที่แสดงคู่โลโก้ */
  label: string;
  description: string;
  /** path ของไฟล์โลโก้ใน public/ */
  logo: string;
  route: string;
  /** สีหลักของแบรนด์ (hex) สำหรับ fallback/กรอบการ์ด */
  accent: string;
};

export const MODULE_BRANDS: ModuleBrand[] = [
  {
    key: "service_business",
    name: "Micro-Business-Service",
    label: "ธุรกิจบริการ (Service)",
    description: "จัดการบริการ นัดหมาย และใบแจ้งหนี้บริการ",
    logo: "/Service.png",
    route: "/service",
    accent: "#a855f7",
  },
  {
    key: "retail",
    name: "Micro-Business-Retail",
    label: "ร้านค้าปลีก (Retail)",
    description: "ขายสินค้า รับชำระ สรุปยอดรายวัน และสต็อกร้านค้า",
    logo: "/Retail2.png",
    route: "/pos",
    accent: "#7c3aed",
  },
  {
    key: "rental",
    name: "Micro-Business-Rental",
    label: "ธุรกิจเช่า (Rental)",
    description: "ทรัพย์สิน สัญญาเช่า ค่าเช่า และการบำรุงรักษา",
    logo: "/Rental.png",
    route: "/rental",
    accent: "#0f766e",
  },
  {
    key: "pharmacy",
    name: "Micro-Business-Pharmacy",
    label: "ร้านขายยา (Pharmacy)",
    description: "ใบสั่งยา สต็อกยา และการแจ้งเตือนวันหมดอายุ",
    logo: "/Pharmacy.png",
    route: "/pharmacy",
    accent: "#0d9488",
  },
  {
    key: "hotel_booking",
    name: "Micro-Business-Hotel",
    label: "ที่พัก/โรงแรม (Hotel)",
    description: "ห้องพัก การจอง check-in/out และแม่บ้าน",
    logo: "/Hotel.png",
    route: "/hotel",
    accent: "#2563eb",
  },
  {
    key: "f_and_b",
    name: "Micro-Business-FNB",
    label: "ร้านอาหาร/คาเฟ่ (F&B)",
    description: "ผังโต๊ะ เปิด/รวมบิล ส่งออเดอร์เข้าครัว (KOT) และออกบิล",
    logo: "/F&B.png",
    route: "/fb",
    accent: "#ea580c",
  },
];

/**
 * ชื่อที่ถูกเรียกต่างกันในแต่ละส่วนของระบบ:
 * - business type ตอนสมัคร: retail, fnb, pharmacy, service, rental, hotel
 * - module id ใน MODULE_REGISTRY: f_and_b, hotel_booking, service_business, ...
 * - plugin pack id: retail_pos, f_and_b, ...
 * ทุกชื่อต้อง resolve กลับมาที่ ModuleBrandKey เดียวกัน
 */
const BRAND_ALIASES: Record<string, ModuleBrandKey> = {
  service: "service_business",
  service_business: "service_business",
  retail: "retail",
  retail_pos: "retail",
  rental: "rental",
  pharmacy: "pharmacy",
  hotel: "hotel_booking",
  hotel_booking: "hotel_booking",
  fnb: "f_and_b",
  f_and_b: "f_and_b",
};

const BRAND_BY_KEY = new Map(MODULE_BRANDS.map((brand) => [brand.key, brand]));

/** เข้าถึงแบรนด์แบบตรงคีย์ ใช้ในหน้าเฉพาะของโมดูล เช่น MODULE_BRAND.f_and_b.logo */
export const MODULE_BRAND = Object.fromEntries(
  MODULE_BRANDS.map((brand) => [brand.key, brand])
) as Record<ModuleBrandKey, ModuleBrand>;

/** ค้นหาโลโก้โมดูลจากชื่อใด ๆ (business type / module id / pack id) */
export function getModuleBrand(key: string | null | undefined): ModuleBrand | undefined {
  if (!key) return undefined;
  const normalized = key.trim().toLowerCase();
  const brandKey = BRAND_ALIASES[normalized];
  return brandKey ? BRAND_BY_KEY.get(brandKey) : undefined;
}
