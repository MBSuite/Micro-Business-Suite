# Micro-Business-Suite (MBS)

## ระบบจัดการบัญชีอัจฉริยะสำหรับธุรกิจขนาดเล็ก

---

## 1. สถานการณ์และปัญหาปัจจุบัน (Current Pain Points)

ทุกวันนี้ SME ไทยต้องเผชิญกับปัญหาที่ซ้ำซากในระบบบัญชีและการจัดการธุรกิจ ซึ่งกระทบกับทุกฝ่ายในองค์กร:

### ผู้บริหาร — เน้นผลลัพธ์และเวลา
- ข้อมูลรายรับ-รายจ่ายไม่ real-time ต้องรอปิดงวดสิ้นเดือน
- ไม่เห็นตัวเลขกำไร-ขาดทุนรายวัน → ตัดสินใจล่าช้า
- รายงานภาษี (PP30, PND3, PND53) ต้องทำ manual ใช้เวลาหลายวัน
- ไม่มี dashboard รวมข้อมูลธุรกิจ → ต้องรวม Excel เอง

### สายกลยุทธ์ — เน้นนวัตกรรม
- ระบบเดิมล้าสมัย ไม่รองรับ cloud / mobile
- ไม่มี AI ช่วยตรวจจับความผิดปกติในบัญชี
- ไม่สามารถขยายสาขาหรือเพิ่ม module ได้เอง
- ขาด integration กับ Google Drive / email / ระบบภายนอก

### สายนโยบาย / ไอที — เน้นความถูกต้องและปลอดภัย
- ข้อมูลผู้ใช้ไม่แยกตามบริษัท (multi-tenant) → เสี่ยงข้อมูลปนกัน
- ไม่มี role-based access control → ใครก็เข้าถึงข้อมูลได้
- ไม่มี audit trail / backup อัตโนมัติ
- ไม่มี license management → ใช้ softwares เถื่อน

### ทีมงานปฏิบัติการ — เน้นเสถียรภาพและความง่าย
- UI ซับซ้อน ใช้งานยาก ต้องฝึกนาน
- ระบบช้า โหลดหน้า dashboard นาน
- ไม่มี mobile-responsive → ใช้งานบนมือถือไม่ได้
- ข้อมูลสูญหายเมื่อระบบ crash

---

## 2. ผลกระทบหากปล่อยไว้ (Future Risks)

หากไม่แก้ไขปัญหาเหล่านี้:

- **เสียโอกาสทางธุรกิจ** — ตัดสินใจล่าช้าเพราะข้อมูลไม่ real-time ทำให้พลาดโอกาสขาย/ลงทุน
- **ต้นทุนแฝง** — จ้างนักบัญชีเพิ่ม, ซื้อ software หลายตัว, ค่าปรับภาษีจากความผิดพลาด
- **ข้อมูลรั่วไหล** — ไม่มี tenant isolation → ข้อมูลลูกค้า/การเงินรั่วสู่คู่แข่ง
- **ทีมงานลาออก** — ระบบที่ใช้ยาก ทำให้พนักงานเครียด ลาออกบ่อย ต้องฝึกคนใหม่
- **การตรวจสอบ (Audit)** — ไม่มี audit trail → ตรวจสอบไม่ได้เมื่อเกิดปัญหา
- **การขยายธุรกิจ** — ระบบเดิมไม่รองรับ multi-branch / multi-module → ขยายไม่ได้

---

## 3. ทางออกด้วย Micro-Business-Suite (MBS)

MBS แก้ปัญหาทั้งหมดผ่าน **4 เสาหลัก** ที่ทำงานร่วมกันอย่างกลมกลืน:

### เสาหลักที่ 1: ปิดงานไว แม่นยำ
- Dashboard real-time (รายรับ-รายจ่าย-กำไร รายวัน)
- รายงานภาษีอัตโนมัติ (PP30, PND3, PND53, WHT)
- ใบ paying/ใบแจ้งหนี้/ใบเสนอราคา สร้างได้ในคลิกเดียว
- ลดเวลาปิดงวดจากหลายวัน → ไม่กี่นาที

### เสาหลักที่ 2: เทคโนโลยีล้ำสมัยเสริมภาพลักษณ์
- Next.js 16 (App Router) + React 19 — UI ทันสมัย ใช้งานง่าย
- AI Auditor (Gemini) — ตรวจจับความผิดปกติในบัญชีอัตโนมัติ
- Google Drive integration — เก็บเอกสารบน cloud
- Email notifications — ส่งใบ paying/แจ้งเตือนอัตโนมัติ
- Mobile-responsive — ใช้งานบนมือถือได้

### เสาหลักที่ 3: สถาปัตยกรรมระดับสากล
- Neon PostgreSQL (pooled) — ฐานข้อมูลระดับ enterprise
- Multi-tenant (company isolation) — ข้อมูลแต่ละบริษัทแยกกัน
- Role-based access control (superadmin/admin/user)
- Module system (เปิด/ปิด module ต่อ company)
- Offline license verification (HMAC-SHA256)
- Security headers (CSP, HSTS, X-Frame-Options)
- Rate limiting + Health endpoint

### เสาหลักที่ 4: ความเสถียรและความง่ายที่ทุกคนวางใจ
- 53 ตารางฐานข้อมูล + migrations ที่ควบคุมได้
- Integration tests 9/9 pass (auth, RBAC, cross-company isolation, IDOR)
- Unit tests 8/8 pass
- In-memory cache (ลด DB round-trip)
- Docker standalone (multi-stage build, non-root user)
- Health endpoint (`/api/health`) สำหรับ monitoring

---

## 4. หลักฐานความน่าเชื่อถือ (Proof of Trust)

### ตารางเปรียบเทียบเชิงลึก

| ด้าน | MBS | ระบบเดิม (Excel/Manual) |
|---|---|---|
| รายงานภาษี | อัตโนมัติ (PP30, PND3, PND53, WHT) | Manual ใช้เวลาหลายวัน |
| ข้อมูล real-time | ✅ Dashboard รายวัน | ❌ รอปิดงวด |
| Multi-tenant | ✅ แยกตามบริษัท | ❌ ข้อมูลปนกัน |
| Role-based access | ✅ superadmin/admin/user | ❌ ใครก็เข้าถึงได้ |
| AI Auditor | ✅ Gemini AI | ❌ ไม่มี |
| Mobile | ✅ responsive | ❌ ใช้ไม่ได้ |
| Cloud backup | ✅ Google Drive | ❌ ไม่มี |
| Security headers | ✅ CSP, HSTS, X-Frame-Options | ❌ ไม่มี |
| Rate limiting | ✅ login 10/min, API 120/min | ❌ ไม่มี |
| Integration tests | ✅ 9/9 pass | ❌ ไม่มี |

### ข้อมูลด้านการทดสอบ
- **Integration tests:** 9/9 pass (auth, admin access, cross-company isolation, IDOR, settings security, db_schema)
- **Unit tests:** 8/8 pass
- **Build:** ผ่าน (Compiled successfully, 78 pages)
- **TypeScript:** ผ่าน (0 errors)
- **Lint:** 0 errors (327 warnings)
- **DB:** 53 ตาราง, column types ตรง (3/3)
- **Security headers:** CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy

### สถาปัตยกรรมระดับสากล
- Neon PostgreSQL (pooled connection, SSL strict)
- Next.js 16 (App Router, Server Components, Server Actions)
- JWT (jose) + bcryptjs, httpOnly cookie, secure (prod)
- Offline license verification (HMAC-SHA256)
- Docker standalone (multi-stage, non-root user)

---

## 5. เหมาะกับใคร? ธุรกิจประเภทใดบ้าง?

### กลุ่มเป้าหมายหลัก
**SME ไทย** ที่ต้องการระบบบัญชี + ภาษีในระบบเดียว โดยไม่ต้องจ้างนักบัญชีเต็มเวลา

### ธุรกิจที่เหมาะ

| ประเภท | ฟีเจอร์ที่ใช้ | เหตุผล |
|---|---|---|
| **ร้านค้า/ร้านอาหาร (F&B)** | POS, ใบ paying, สินค้าคงคลัง, สาขา, โปรโมชั่น, ความภักดี | มี module F&B + multi-branch + promotions |
| **บริการ (Service)** | ใบเสนอราคา, ใบแจ้งหนี้, รายจ่าย, WHT | Service module + quotation + invoice + WHT 3%/5% |
| **ค้าส่ง/ค้าปลีก** | สินค้าคงคลัง, ใบ paying, ลูกค้า, รายงาน | Inventory + contacts + sales analytics |
| **ฟรีแลนซ์/ที่ปรึกษา** | ใบแจ้งหนี้, รายจ่าย, ภาษี | Invoice + expense + PND3/PND53 |
| **ธุรกิจขนาดเล็ก (1-5 คน)** | บัญชีพื้นฐาน, ภาษี | License 5 users, PROFESSIONAL plan |
| **ธุรกิจที่มีหลายสาขา** | Multi-branch, สาขา stock | Branch module + branch_stock |

### ขนาดธุรกิจ
- **Micro (1-2 คน):** ใช้ฟีเจอร์พื้นฐาน (ใบ paying, รายจ่าย, ภาษี)
- **Small (3-10 คน):** ใช้ครบ (บัญชี, สินค้า, สาขา, payroll)
- **Medium (10+ คน):** ใช้ multi-branch + promotions + loyalty + multi-user

### ธุรกิจที่ **ไม่เหมาะ**
- องค์กรขนาดใหญ่ (Enterprise) ที่ต้องการ ERP เต็มรูปแบบ
- ธุรกิจที่ต้องการ real-time inventory ข้ามสาขา (MBS ยังไม่ real-time sync)
- ธุรกิจที่ต้องการ multi-currency / multi-country

---

## 6. ฟีเจอร์หลัก (Core Features)

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

## 7. สถาปัตยกรรม (Architecture)

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
- Security headers (CSP, HSTS, X-Frame-Options)
- Offline license verification (HMAC-SHA256)

---

## 8. Deployment

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

## 9. สรุป

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
