/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
"use client";

import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  Building2,
  ChefHat,
  CreditCard,
  Package,
  Puzzle,
  ReceiptText,
  ScanLine,
  ShieldCheck,
  Truck,
  Users,
  X,
} from "lucide-react";

const features = [
  {
    icon: ReceiptText,
    title: "บัญชีและเอกสาร",
    description: "จัดการรายรับ รายจ่าย ใบแจ้งหนี้ ใบเสนอราคา ใบเสร็จ และเอกสารธุรกิจในที่เดียว",
    details: [
      "บันทึกรายรับ/รายจ่ายและสมุดรายวันอัตโนมัติ",
      "ใบแจ้งหนี้ ใบเสนอราคา ใบเสร็จ/ใบกำกับภาษี",
      "รอบบิลอัตโนมัติ (Recurring)",
    ],
  },
  {
    icon: BarChart3,
    title: "ภาษีและรายงาน",
    description: "รายงานภาษี VAT/WHT แบบเรียลไทม์ และงบกำไรขาดทุน",
    details: [
      "รายงานภาษีสรุป VAT ซื้อ-ขาย",
      "ภาษีหัก ณ ที่จ่าย (ภ.ง.ด.53)",
      "งบกำไรขาดทุน (P&L) และกระแสเงินสด",
    ],
  },
  {
    icon: ScanLine,
    title: "POS คิดเงินด่วน (Add-on)",
    description: "เครื่องคิดเงินด่วน: สแกนบาร์โค้ด, ตะกร้า, ชำระหลายรูปแบบ, ตัดสต็อกอัตโนมัติ",
    details: [
      "สแกนบาร์โค้ด/SKU/ชื่อสินค้า",
      "ชำระเงิน: เงินสด, QR Code, บัตรเครดิต/เดบิต",
      "ประเมินโปรโมชันอัตโนมัติและตัดสต็อกทันที",
    ],
  },
  {
    icon: BarChart3,
    title: "วิเคราะห์ยอดขาย (Add-on)",
    description: "สรุปรายวัน/รายเดือน, สินค้าขายดี, ช่วงเวลาขายดี, ช่องทางชำระ",
    details: [
      "สรุปยอดขายรายวัน/รายเดือน",
      "สินค้าขายดี (Top 10)",
      "ช่วงเวลาขายดี (Peak Hours)",
    ],
  },
  {
    icon: Users,
    title: "CRM / สมาชิก / สะสมคะแนน (Add-on)",
    description: "บันทึกประวัติการซื้อ, สะสมคะแนน, สิทธิ์สมาชิก (bronze/silver/gold/platinum)",
    details: [
      "สะสมแต้มอัตโนมัติ (1 แต้ม/100 บาท)",
      "ประวัติการซื้อและประวัติคะแนน",
      "ระดับสมาชิก bronze/silver/gold/platinum",
    ],
  },
  {
    icon: Building2,
    title: "หลายสาขา (Add-on)",
    description: "จัดการสาขาและสต็อกแยกสาขา ตัดสต็อกได้หลายสาขา",
    details: [
      "สร้าง/จัดการสาขา",
      "สต็อกแยกสาขา (branch_stock)",
      "เลือกสาขาที่ POS",
    ],
  },
  {
    icon: ChefHat,
    title: "ร้านอาหาร/คาเฟ่ F&B (Add-on)",
    description: "ผังโต๊ะ, เปิด/รวมบิล, ส่งออเดอร์เข้าครัว (KOT), ออกบิล",
    details: [
      "ผังโต๊ะและสถานะโต๊ะ",
      "ส่งออเดอร์เข้าครัว (KOT)",
      "ออกบิลและชำระเงิน",
    ],
  },
  {
    icon: Truck,
    title: "เชื่อมต่อ E-commerce / Delivery (Add-on)",
    description: "เชื่อมต่อ Shopee, Lazada, เว็บไซต์ร้าน และ GrabFood, LINE MAN, Foodpanda",
    details: [
      "จัดการการเชื่อมต่อ (connections)",
      "Inbound webhook import ออเดอร์ → invoice",
      "Sync สถานะการเชื่อมต่อ",
    ],
  },
  {
    icon: Puzzle,
    title: "ปลักอิน / Add-on (Plugin Manager)",
    description: "MBSuite = Core; โมดูลเพิ่มเติมติดตั้ง/ถอนได้ต่อ company ผ่าน /admin/plugins",
    details: [
      "ติดตั้ง/ถอนกลุ่มโมดูล (packs)",
      "กลุ่มลูกค้า: Retail, F&B, Pharmacy, Service",
      "Core ปิดไม่ได้, Add-on เปิด/ปิดได้",
    ],
  },
  {
    icon: ShieldCheck,
    title: "ความปลอดภัยและสิทธิ์",
    description: "RBAC ตามตำแหน่ง, multi-tenant แยกบริษัท, license perpetual/subscription",
    details: [
      "สิทธิ์ตามกลุ่ม/ตำแหน่ง (superadmin/admin/user)",
      "แยกข้อมูลตาม company (multi-tenant)",
      "ขายขาด (perpetual) หรือรายเดือน/รายปี (subscription)",
    ],
  },
  {
    icon: Package,
    title: "คลังสินค้า (Inventory)",
    description: "จัดการสต็อกสินค้า พร้อม QR Code + Barcode",
    details: [
      "สต็อกสินค้าและหมวดหมู่",
      "QR Code + Barcode ต่อสินค้า",
      "แจ้งเตือนสินค้าใกล้หมด",
    ],
  },
  {
    icon: CreditCard,
    title: "การชำระเงินและใบเสร็จ",
    description: "รองรับการชำระหลายรูปแบบ และพิมพ์ใบเสร็จ/ใบกำกับภาษี",
    details: [
      "เงินสด, QR Code, บัตรเครดิต/เดบิต",
      "พิมพ์ใบเสร็จ/ใบกำกับภาษี",
      "บันทึกการชำระเงินอัตโนมัติ",
    ],
  },
];

export default function LandingFeatures() {
  const [selectedFeature, setSelectedFeature] = useState<
    (typeof features)[number] | null
  >(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!selectedFeature) return;

    const previouslyFocused = document.activeElement;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedFeature(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, [selectedFeature]);

  return (
    <>
      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
          <button
            key={feature.title}
            type="button"
            onClick={() => setSelectedFeature(feature)}
            aria-haspopup="dialog"
            className="group rounded-3xl border border-slate-100 bg-white p-7 text-left shadow-sm transition hover:-translate-y-1 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-100/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Icon size={22} />
            </span>
            <span className="mt-5 block text-lg font-black text-slate-900">{feature.title}</span>
            <span className="mt-2 block text-sm leading-7 text-slate-500">{feature.description}</span>
            <span className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:text-indigo-700">
              ดูรายละเอียด
              <span aria-hidden="true">→</span>
            </span>
          </button>
          );
        })}
      </div>

      {selectedFeature && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedFeature(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="feature-dialog-title"
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <selectedFeature.icon size={22} />
                </div>
                <h3
                  id="feature-dialog-title"
                  className="mt-5 text-2xl font-black tracking-tight text-slate-950"
                >
                  {selectedFeature.title}
                </h3>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setSelectedFeature(null)}
                aria-label="ปิดรายละเอียด"
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <X size={20} />
              </button>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              {selectedFeature.description}
            </p>
            <ul className="mt-6 space-y-3">
              {selectedFeature.details.map((detail) => (
                <li key={detail} className="flex gap-3 text-sm leading-6 text-slate-700">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500"
                  />
                  {detail}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setSelectedFeature(null)}
              className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              เข้าใจแล้ว
            </button>
          </section>
        </div>
      )}
    </>
  );
}
