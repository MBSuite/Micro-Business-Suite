/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  FileText,
  Github,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import LandingFeatures from "@/components/LandingFeatures";

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-900">
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="Micro-Business-Suite หน้าหลัก">
          <Image
            src="/logo.png"
            alt=""
            width={81}
            height={56}
            className="h-10 w-auto object-contain"
          />
          <span className="text-sm font-black tracking-tight sm:text-base">
            MICRO-BUSINESS-SUITE
          </span>
        </Link>
        <nav aria-label="เมนูหลัก" className="flex items-center gap-3">
          <Link
            href="#features"
            className="hidden rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:inline-flex"
          >
            ฟีเจอร์
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
          >
            เข้าสู่ระบบ
          </Link>
        </nav>
      </header>

      <section className="relative isolate">
        <div className="absolute inset-x-0 top-0 -z-10 h-[620px] bg-gradient-to-br from-indigo-50 via-white to-violet-50" />
        <div className="absolute right-[-8rem] top-20 -z-10 h-80 w-80 rounded-full bg-violet-200/40 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 pb-24 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:pb-32 lg:pt-24">
          <div className="max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-4 py-2 text-xs font-bold text-indigo-700 shadow-sm">
              <Sparkles size={15} />
              ระบบจัดการธุรกิจสำหรับเจ้าของกิจการ
            </div>
            <h1 className="text-4xl font-black leading-[1.2] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              ดูแลบัญชีและธุรกิจ
              <span className="mt-2 block bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                ได้ง่ายในที่เดียว
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              จัดการรายรับ รายจ่าย เอกสาร ภาษี และข้อมูลลูกค้า
              พร้อมเห็นภาพรวมธุรกิจของคุณได้อย่างเป็นระบบ
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-7 text-sm font-black text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700"
              >
                เริ่มต้นใช้งาน
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/register"
                className="inline-flex h-13 items-center justify-center rounded-2xl border border-slate-200 bg-white px-7 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50"
              >
                ลงทะเบียนขอเข้าใช้งาน
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-semibold text-slate-500">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600" />
                เข้าถึงระบบด้วยบัญชีของคุณ
              </span>
              <span className="inline-flex items-center gap-2">
                <Users size={16} className="text-indigo-600" />
                รองรับการจัดการผู้ใช้งาน
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-indigo-200/70 to-violet-200/50 blur-2xl" />
            <div className="relative rounded-[2rem] border border-white bg-white p-4 shadow-2xl shadow-indigo-200/50 sm:p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">ภาพรวมธุรกิจ</p>
                    <p className="mt-0.5 text-xs font-medium text-slate-400">จัดการงานสำคัญได้จากหน้าหลัก</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700">
                  พร้อมใช้งาน
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 py-5">
                <div className="rounded-2xl bg-indigo-50/80 p-4">
                  <p className="text-xs font-bold text-indigo-700">รายรับและรายจ่าย</p>
                  <div className="mt-5 flex h-14 items-end gap-1.5" aria-hidden="true">
                    {[35, 54, 42, 68, 49, 82, 61, 94, 72, 100, 77, 88].map((height, index) => (
                      <span
                        key={index}
                        className={`flex-1 rounded-t-sm ${index % 3 === 0 ? "bg-violet-300" : "bg-indigo-500"}`}
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex flex-col justify-between rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold text-slate-600">เครื่องมือธุรกิจ</p>
                  <div className="mt-4 space-y-2.5">
                    <div className="flex items-center gap-2 rounded-xl bg-white p-2.5 text-xs font-bold text-slate-700 shadow-sm">
                      <ReceiptText size={15} className="text-indigo-600" />
                      ใบแจ้งหนี้
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-white p-2.5 text-xs font-bold text-slate-700 shadow-sm">
                      <FileText size={15} className="text-violet-600" />
                      รายงานภาษี
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-100 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <CalendarDays size={19} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800">ทุกงานสำคัญ เป็นระเบียบ</p>
                  <p className="mt-1 text-[11px] font-medium text-slate-500">ติดตามข้อมูลและกำหนดการจากระบบเดียว</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl scroll-mt-10 px-6 py-20 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-600">
            Micro-Business-Suite
          </p>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            เครื่องมือที่ช่วยให้ธุรกิจเดินหน้า
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">
            รวมงานจัดการธุรกิจที่จำเป็นไว้ในระบบเดียว ใช้งานสะดวกและมองเห็นภาพรวมได้ชัดเจน
          </p>
        </div>
        <LandingFeatures />
      </section>

      <footer className="border-t border-slate-100 bg-slate-50/70">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-7 text-center sm:flex-row sm:text-left lg:px-10">
          <p className="text-xs font-medium text-slate-500">
            Powered by Microtronic © 2026 Microtronic Co., Ltd.
          </p>
          <a
            href="https://microtronic.biz/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-slate-500 hover:text-indigo-600"
          >
            https://microtronic.biz/
          </a>
          <div className="flex items-center gap-5">
            <Link href="/login" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
              เข้าสู่ระบบ
            </Link>
            <a
              href="https://github.com/MBSuite/Micro-Business-Suite"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm transition hover:border-slate-900 hover:bg-slate-900 hover:text-white"
            >
              <Github size={16} />
              <span>Source code</span>
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
