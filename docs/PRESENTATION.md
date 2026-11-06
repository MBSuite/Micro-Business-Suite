# Micro-Business-Suite (MBS)

## ระบบจัดการบัญชีอัจฉริยะสำหรับธุรกิจขนาดเล็ก

---

## 1. ภาพรวม (Overview)

- **ชื่อผลิตภัณฑ์:** Micro-Business-Suite (MBS)
- **ประเภท:** Web Application (SaaS-ready)
- **เป้าหมาย:** จัดการบัญชี รายรับ-รายจ่าย เอกสาร และภาษีธุรกิจในระบบเดียว
- **ผู้ใช้เป้าหมาย:** ธุรกิจขนาดเล็ก-กลาง (SME) ที่ต้องการระบบบัญชีที่ใช้งานง่าย

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4, Framer Motion |
| Backend | Next.js API Routes, Server Components, Server Actions |
| Database | Neon PostgreSQL (pooled + direct), 53 tables |
| Auth | JWT (jose) + bcryptjs, httpOnly cookie, role-based (superadmin/admin/user) |
| Infra | Vercel / Docker (standalone), Neon DB |
| Integrations | Google Drive (OAuth), Gmail (email), Gemini AI, Excel/PDF export |

---

## 3. ฟีเจอร์หลัก (Core Features)

### บัญชีและการเงิน
- สมุดรายวัน (Journal Entries) + ผังบัญชี (Chart of Accounts)
- ใบแจ้งหนี้ (Invoices) + ใบเสนอราคา (Quotations)
- ใบ paying (Payments) + ใบ paying (Vouchers) + ใบ paying (Receipts)
- รายจ่าย (Expenses) + WHT 50/53
- รายงานกำไร-ขาดทุน (P&L), Cash Flow, Sales Analytics

### ภาษี (Thai Tax)
- PP30 (ภาษีมูลค่าเพิ่ม), PND53/PND3 (ภาษีหัก ณ ที่จ่าย)
- ภาษีหัก ณ ที่จ่าย (WHT) 3%, 5%, 10%
- รายงานภาษีอัตโนมัติ

### การจัดการ
- ลูกค้า/ผู้ติดต่อ (Contacts/CRM)
- สินค้า/บริการ (Products/Services)
- สินค้าคงคลัง (Inventory) + สาขา (Branches)
- พนักงาน/เงินเดือน (Payroll)
- โปรโมชั่น (Promotions) + ความภักดี (Loyalty)

### ระบบ
- Multi-tenant (company isolation)
- Role-based access control (superadmin/admin/user)
- Module system (เปิด/ปิด module ต่อ company)
- License (offline signed, perpetual/subscription)
- AI Auditor (Gemini)
- Google Drive integration (per-company)

---

## 4. สถาปัตยกรรม (Architecture)

```
┌─────────────────────────────────────────┐
│  Browser (React 19 + Tailwind)          │
├─────────────────────────────────────────┤
│  Next.js 16 (App Router)                │
│  ├── Server Components (SSR)            │
│  ├── API Routes (/api/*)                │
│  ├── Server Actions (app/actions)       │
│  └── Proxy (proxy.ts) — auth + RBAC     │
├─────────────────────────────────────────┤
│  Neon PostgreSQL (pooled)               │
│  ├── 53 tables                          │
│  ├── Multi-tenant (company_id)          │
│  └── Migrations (scripts/bootstrap)     │
└─────────────────────────────────────────┘
```

### Security
- JWT (jose) + bcrypt, httpOnly cookie, secure (prod)
- Role-based guards (proxy + API)
- Tenant isolation (company_id on all tables)
- Rate limiting (login 10/min, API 120/min per IP)
- Security headers (CSP, HSTS, X-Frame-Options, etc.)
- Offline license verification (HMAC-SHA256)

---

## 5. Production Readiness

### ✅ เสร็จแล้ว
- Build / TypeScript / Lint (0 errors)
- Unit tests 8/8 + Integration tests 9/9
- License valid (perpetual, PROFESSIONAL)
- DB migrations applied (53 tables)
- Security headers + Rate limiting + Health endpoint
- Google Drive integration (OAuth + API Key + Encryption)
- Gmail (email notifications)
- Gemini AI (AI auditor)
- Recurring billing (cron)
- Performance (parallel queries, optimizePackageImports)

### ⚠️ ข้อจำกัด
- Rate limiter in-memory (single-instance only)
- CSP ยังมี unsafe-inline (Next.js ต้องการ)
- Neon branch ยังไม่ยืนยัน (staging vs production)

---

## 6. Performance

| จุด | ก่อน | หลัง |
|---|---|---|
| Dashboard TTFB | ~4-5s (sequential queries) | ~0.5s (Promise.all) |
| Client bundle | ใหญ่ (lucide/framer-motion) | ลด (optimizePackageImports) |
| Favicon | 210KB (1024×1024) | ใช้ไฟล์ที่เหมาะสม |
| DB round-trips | ทุก navigation query DB | Cache 30s (user status) |

---

## 7. Deployment

### Vercel (แนะนำ)
- Native Next.js support (Proxy, ISR, Image Optimization)
- Neon integration (pooled URL พร้อมใช้)
- Fluid Compute (cold start ต่ำ)
- Vercel Cron (keep-alive ping)

### Docker (standalone)
```bash
docker compose --env-file .env.local up -d --build
```
- Multi-stage build, non-root user
- Build-time placeholder env, runtime env from .env.local

### Environment Variables
- `DATABASE_URL` / `POSTGRES_URL` (Neon pooled)
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `SESSION_MAX_AGE`
- `LICENSE_SALT`, `MBS_LICENSE_KEY`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
- `NEXT_PUBLIC_GOOGLE_API_KEY`, `GOOGLE_TOKEN_ENCRYPTION_KEY`
- `GMAIL_FROM`, `GMAIL_APP_PASSWORD`
- `GEMINI_API_KEY`
- `RECURRING_SECRET`, `CRON_ENABLED`

---

## 8. สรุป

**Micro-Business-Suite** เป็นระบบบัญชีอัจฉริยะสำหรับ SME ที่:
- ครอบคลุมบัญชี ภาษี เอกสาร และการจัดการธุรกิจในระบบเดียว
- รองรับ multi-tenant + role-based access
- ใช้ Next.js 16 + Neon PostgreSQL
- พร้อม production (core + Google Drive + Gmail + AI + Recurring billing)
- มี security headers, rate limiting, health endpoint
- มี integration tests 9/9 pass

**พร้อม deploy บน Vercel หรือ Docker** ✅

---

*เอกสารนี้สร้างเมื่อ 2026-11-07 สำหรับนำเสนอ MBS*
