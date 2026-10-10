"use client";

import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  ReceiptText,
  X,
} from "lucide-react";

const features = [
  {
    icon: ReceiptText,
    title: "บัญชีและเอกสาร",
    description: "จัดการรายรับ รายจ่าย ใบแจ้งหนี้ และเอกสารธุรกิจได้ในที่เดียว",
    details: [
      "บันทึกรายรับและรายจ่ายไว้ในระบบเดียว",
      "จัดทำและติดตามใบแจ้งหนี้กับเอกสารธุรกิจ",
      "ค้นดูข้อมูลที่เกี่ยวข้องได้สะดวกขึ้น",
    ],
  },
  {
    icon: BarChart3,
    title: "เห็นภาพรวมธุรกิจ",
    description: "ติดตามตัวเลขสำคัญและกระแสเงินสด เพื่อวางแผนได้อย่างมั่นใจ",
    details: [
      "ดูสรุปรายรับและรายจ่ายของธุรกิจ",
      "ติดตามยอดค้างชำระและความเคลื่อนไหวทางการเงิน",
      "ใช้ข้อมูลประกอบการวางแผนธุรกิจ",
    ],
  },
  {
    icon: CalendarDays,
    title: "ภาษีและกำหนดการ",
    description: "รวบรวมรายงานภาษีและรายการที่ต้องติดตามไว้ให้เป็นระเบียบ",
    details: [
      "ดูรายงานภาษีที่เกี่ยวข้องจากระบบ",
      "ติดตามกำหนดการและรายการเตือนความจำ",
      "รวมงานที่ต้องจัดการไว้ในที่เดียว",
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
      <div className="mt-12 grid gap-5 md:grid-cols-3">
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
