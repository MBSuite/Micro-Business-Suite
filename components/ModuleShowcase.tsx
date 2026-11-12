import Image from "next/image";
import { MODULE_BRANDS } from "@/lib/module-logos";

/**
 * แสดงโลโก้ 6 โมดูลธุรกิจบนหน้า landing
 * โลโก้ทั้งหมดดึงจาก lib/module-logos.ts (Single Source of Truth)
 */
export default function ModuleShowcase() {
  return (
    <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {MODULE_BRANDS.map((brand) => (
        <article
          key={brand.key}
          className="group flex items-start gap-4 rounded-3xl border border-slate-100 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-100/50"
        >
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-100"
            style={{ boxShadow: `inset 0 0 0 1px ${brand.accent}14` }}
          >
            <Image
              src={brand.logo}
              alt={`โลโก้ ${brand.name}`}
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
            />
          </span>
          <div>
            <h3 className="text-base font-black tracking-tight text-slate-900">
              {brand.label}
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">{brand.description}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
