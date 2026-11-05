# Micro Business Suite: ระบบบัญชีอัจฉริยะ

ระบบบริหารจัดการบัญชีและภาษีอัตโนมัติสำหรับ SMEs — รองรับการออกเอกสาร การทำบัญชีรายวัน ภาษีทุกประเภท (VAT / WHT / ภ.ง.ด.) โมดูลเปิดปิดได้ และเชื่อมต่อกับระบบ Google (คลาวด์/รายงานอัตโนมัติ)

---

## ฟีเจอร์หลัก

### ขาย (Sales)
- ใบเสนอราคา (Quotation) พร้อมหน้าพิมพ์/Preview
- ใบแจ้งหนี้ (Invoice) พร้อมหน้าพิมพ์ + AI Auto-Journal (บันทึกเดบิต/เครดิตอัตโนมัติเมื่อออกบิล)
- รอบบิลอัตโนมัติ (Recurring) — สร้างใบแจ้งหนี้จากรอบที่ตั้งไว้
- ใบเสร็จรับเงิน (Receipt) — **พิมพ์ใบเสร็จ/ใบกำกับภาษีแบบเดียว** (RECEIPT / TAX INVOICE) จากทุกจุดเข้ารายการ
- **POS คิดเงินด่วน** (`/pos`) — สแกนบาร์โค้ด/SKU, ตะกร้า, ชำระหลายรูปแบบ (เงินสด/QR/บัตร), ตัดสต็อกอัตโนมัติ (plugin: retail_pos)
- **โปรโมชัน/ส่วนลด** (`/promotions`) — rules engine percentage/fixed/bogo/bundle, auto-apply ที่ POS (plugin: promotions)

### วิเคราะห์ (Analytics)
- **วิเคราะห์ยอดขาย** (`/reports/sales-analytics`) — สรุปรายวัน/รายเดือน, สินค้าขายดี, ช่วงเวลาขายดี, ช่องทางชำระ

### CRM & สมาชิก
- **CRM/สะสมคะแนน** (`/crm`) — ประวัติการซื้อ, สะสมคะแนน (1 แต้ม/100฿), ระดับสมาชิก bronze/silver/gold/platinum, auto-accrual ที่ POS (plugin: crm_loyalty)

### หลายสาขา (Multi-Branch)
- **สาขา** (`/branches`) — จัดการสาขา + สต็อกแยกสาขา (branch_stock), branch selector ที่ POS (plugin: multi_branch)

### ร้านอาหาร/คาเฟ่ (F&B)
- **F&B** (`/fb`) — ผังโต๊ะ, เปิด/รวมบิล, ส่งออเดอร์เข้าครัว (KOT), ออกบิล, ชำระเงิน (plugin: f_and_b)

### เชื่อมต่อ (Integrations)
- **E-commerce** (`/integrations/ecommerce`) — Shopee, Lazada, เว็บไซต์ร้าน (plugin: ecommerce_integration)
- **Delivery** (`/integrations/delivery`) — GrabFood, LINE MAN, Foodpanda (plugin: delivery_integration)
- Inbound webhook: `POST /api/integrations/webhook` (import ออเดอร์ → invoice)

### ปลักอิน/Add-on (Plugin Manager)
- **จัดการปลักอิน** (`/admin/plugins`) — ติดตั้ง/ถอนการติดตั้ง กลุ่มโมดูล (packs) ต่อ company
- โมดูลหลัก = MBSuite Core (ปิดไม่ได้); add-on ติดตั้งเพิ่มได้
- กลุ่ม packs: retail_pos, sales_analytics, crm_loyalty, multi_branch, inventory_variants, employee_sales, f_and_b, ecommerce_integration, delivery_integration, offline_mode, pharmacy, service_business

### ค่าใช้จ่ายและบัญชี (Operations)
- ค่าใช้จ่าย / ซัพพลายเออร์ พร้อมแนบหลักฐาน (รูป / ลิงก์ Google Drive)
- ค่าแรงพนักงาน (Payroll) พร้อมระบบตรวจสอบความถูกต้อง (มี automated tests)
- ใบสำคัญจ่าย (Voucher) + พิมพ์เอกสารสรุปยอดปลายเดือน
- สมุดรายวัน (Journal) — ระบบจดบัญชีอัตโนมัติ + ทะเบียนภาษี

### ข้อมูลหลัก (Master Data)
- คลังสินค้า (Inventory) พร้อม **QR Code + Barcode** ต่อสินค้า
- ราคากลางบริการ (Services)
- ผังบัญชี (COA)
- ผู้ติดต่อ / คู่ค้า (Contacts)

### รายงานและภาษี (Reports & Tax)
- รายงานภาษีสรุป VAT ซื้อ-ขาย และภาษีหัก ณ ที่จ่าย แบบเรียลไทม์
- **RD-Ready:** เชื่อมต่อ RD API Portal (e-Tax Invoice / Withholding) ผ่าน `lib/rd-api.ts` + เทมเพลตไฟล์ `.txt` ภ.พ.30 / ภ.ง.ด.53 (ดู `docs/PP30.txt`, `docs/PND53.txt`)
- งบกำไรขาดทุน (P&L)

### AI และระบบอัตโนมัติ
- ผู้ช่วย AI ถาม-ตอบด้านบัญชี (`/ai`) + AI Chat ทั่วแอพ
- **AI Auditor** — ตรวจสอบความผิดปกติของข้อมูลและกระเปาะแจ้งเตือน + job รายงานอัตโนมัติ (`npm run ai:audit`)
- **Tax Automator** — เตรียม/ประมวลผลยอดภาษีจากข้อมูลจริง (`npm run tax:update`)

### คลาวด์ & ระบบอัตโนมัติ Google (Google-First)
- ปุ่มสรุปยอดรายเดือนส่งขึ้น **Google Drive**
- **Auto-backup ฐานข้อมูล** ขึ้น Drive ทุกวัน 02:00 (เก็บ 30 วัน) — `scripts/auto-backup.mjs`
- **Sheets Dashboard** ภาพรวมรายเดือน/รายจ่ายแยกหมวด/รายการล่าสุด อัปเดต 02:05 — `scripts/dashboard-sheet.mjs`
- **Calendar เตือนอัตโนมัติ** — จ่ายบิล Google Workspace, ต่ออายุลูกค้า (ต้องการ config ผู้ใช้เพิ่มเติม)

### การจัดการ (Admin)
- จัดการสมาชิก / บทบาท (RBAC) ตาม `docs/RBAC_STANDARD.md`
- จัดการกลุ่ม / สิทธิ์เข้าถึงรายโมดูล
- เปิด-ปิดโมดูลได้ (ตั้งค่าผ่านหน้า /admin/modules หรือ env `NEXT_PUBLIC_MODULE_*`)
- จัดการปลักอิน/Add-on (`/admin/plugins`)
- Database Backup

---

## เริ่มใช้งาน

1. หน้าแรก (Dashboard) — ภาพรวมสุขภาพการเงิน
2. ออกเอกสาร: ใบเสนอราคา → ใบแจ้งหนี้ → รับชำระ (ใบเสร็จ/ใบกำกับภาษี)
3. ปิดงบเดือน: กด "สรุปยอดส่งเข้า Google Drive" (หรือตั้ง cron backup/dashboard)

## ขั้นตอนติดตั้ง

```
npm install
cp .env.example .env.local   # ตั้งค่า DATABASE_URL + Secrets
npm run dev
```

Scripts ที่ใช้ได้: `npm test` (รัน `tests/*.test.mjs`), `npm run lint`, `npm run tax:update`, `npm run ai:audit`, `npm run check:knowledge`, `npm run check:consistency`

cron ภายนอก (ตั้งแล้วบนเครื่องพี่): `scripts/auto-backup.mjs` 02:00 น. + `scripts/dashboard-sheet.mjs` 02:05 น.

---

## ส่งมอบแบบ Docker (ขายขาด / ติดตั้งให้ลูกค้า)

```bash
cp .env.example .env.local

# 1) ออก license ให้ลูกค้า (ฝั่งผู้ขาย — sign ด้วย LICENSE_SALT ตัวเดียวกับฝั่ง app)
node scripts/issue-license.mjs \
  --mode perpetual --company "ชื่อลูกค้า" --licensee "อีเมลลูกค้า" \
  --max-users 5

# 2) ใส่ค่าจริงใน .env.local (ของเครื่องลูกค้า):
#    LICENSE_SALT   = salt เดียวกับฝั่งผู้ขาย
#    MBS_LICENSE_KEY = license key ที่ออกให้ลูกค้ารายนี้
#    DATABASE_URL   = postgresql://mbs:mbs@db:5432/mbs?sslmode=disable
#    NEXTAUTH_SECRET / AUTH_SECRET = random secret

# 3) รัน (สร้าง PostgreSQL + app พร้อมกัน — schema โหลดอัตโนมัติ)
docker compose up -d --build
```

- เปิดแอพที่: `http://localhost:3000`
- สร้าง admin ครั้งแรก: หน้า `/register` → register แล้วกด `promote` เป็น superadmin
- **license lock:** production (`docker compose`) จะ fail-fast ถ้า `MBS_LICENSE_KEY` ผิด/หมดอายุ (subscription) — perpetual ไม่หมดอายุ, subscription หมดอายุเมื่อถึง `expires_at`
- โหมดการขาย: `PRODUCT_MODE=perpetual` (ขายขาด) หรือ `PRODUCT_MODE=subscription` (เช่า รายเดือน)

---

## เทคนิค

- **Stack:** Next.js 16 (App Router) + React 19 + TypeScript 5
- **UI:** Tailwind CSS 4 + lucide-react
- **ฐานข้อมูล:** PostgreSQL (ผ่าน `@vercel/postgres`; สคริปต์อัตโนมัติใช้ `pg`)
- **เอกสาร PDF:** jspdf / jspdf-autotable / exceljs · **Barcode/QR:** react-barcode / qrcode.react
- **จ็อบเบื้องหลัง:** node-cron (recurring, tax, ai-audit)
- **Integration:** googleapis (Drive / Sheets / Calendar) — อ่าน OAuth จาก `.env.local` ผ่าน `scripts/google-auth.mjs`

---

## เอกสารอ้างอิง

- กฎระบบหลัก: `CORE_RULES.md`, `AUTH_RULES.md`
- มาตรฐานสิทธิ์: `docs/RBAC_STANDARD.md`
- คู่มือใช้งาน: `docs/USER_MANUAL.md`, `docs/COMPLETE_MANUAL.md`
- ความรู้ทางภาษี: `docs/THAI_TAX_GUIDE.md`, `docs/KNOWLEDGE_PACK.md`
- สถาปัตยกรรม: `docs/ARCHITECTURE.md`
- บันทึกการตัดสินใจ: `docs/DECISIONS.md` (มีจริง — ตรวจสอบแล้ว 28 ต.ค. 2569)
- **ข้อควรระวัง:** `DESK/NOW.md`, `MEMORY/DECISIONS.md`, `KNOWLEDGE/MBSUITE/` อ้างในเอกสารบางฉบับแต่ **ไม่มีจริง**ใน repo นี้ — ใช้ `docs/DECISIONS.md` แทน