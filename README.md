# Micro Business Suite: ระบบบัญชีอัจฉริยะ

ระบบบริหารจัดการบัญชีและภาษีอัตโนมัติสำหรับ SMEs — รองรับการออกเอกสาร การทำบัญชีรายวัน ภาษีทุกประเภท (VAT / WHT / ภ.ง.ด.) โมดูลเปิดปิดได้ และเชื่อมต่อกับระบบ Google (คลาวด์/รายงานอัตโนมัติ)

## แนวคิดผลิตภัณฑ์และขอบเขตระบบ

**MB (Micro Business)** หมายถึงธุรกิจขนาดเล็กและ SME ส่วน **Suite** คือชุดระบบที่เลือกใช้ให้ตรงกับประเภทธุรกิจ ลูกค้าเริ่มจากโมดูลที่ต้องใช้ และเชื่อมเข้ากับ Core เมื่อจำเป็นต้องรวมบัญชีและรายงานระดับบริษัท

`Micro-Business-Suite` คือ **Core กลางด้านบัญชีและการบริหารองค์กร** โดยเหมาะกับธุรกิจที่มีหลายสาขา หลายกิจการ หรือแฟรนไชส์ หน้าที่หลักคือรวบรวมข้อมูลทางการเงินและปฏิบัติการเพื่อทำบัญชี รายงานยอดรายเดือน วิเคราะห์รายได้ ต้นทุน กำไร/ขาดทุน ภาพรวมสต็อก และเตรียมคำนวณภาษีในระดับองค์กร

แนวทางผลิตภัณฑ์ที่แนะนำคือให้บริการ Core และแต่ละโมดูลเป็น SaaS แยกตามความต้องการของลูกค้า โดย Core/โมดูลเป็นรูปแบบการให้บริการ ส่วน POS เป็นฟังก์ชันการขายหน้าร้าน ไม่ใช่รูปแบบผลิตภัณฑ์แทน SaaS

คำว่า SaaS ในเอกสารนี้เป็น **ทิศทางการจัดแพ็กเกจผลิตภัณฑ์** โค้ด Core มี self-service registration ที่สร้างบริษัท Trial และผู้ใช้แรก พร้อมเลือกประเภทธุรกิจ General, Retail, F&B, Pharmacy, Service, Rental หรือ Hotel ได้ โดย Rental/Hotel ผ่าน integration test บนฐานข้อมูล disposable ในเครื่องแล้ว ส่วนการยอมรับงานฝั่ง Dev ยังรอทดสอบ signup และลบสมาชิกจริงบนฐาน Dev ตามเกณฑ์เจ้าของ หลังผ่านขั้นนี้จึงทำและตรวจ 2FA; ห้ามพิจารณาขึ้น Production ก่อน 2FA ผ่าน Production ใช้ Supabase ส่วน Neon ที่เจ้าของยืนยันเป็นฐาน Dev และยังไม่มีการทดสอบเขียนข้อมูลในงานนี้ การระบุนี้ไม่ได้รับรองว่าการจัดการ tenant/สาขา การกำหนดสิทธิ์ตามแพ็กเกจ หรือการเรียกเก็บเงินอัตโนมัติครบแล้ว และ license mode ที่มีอยู่ไม่ใช่วงจร subscription billing ที่สมบูรณ์

โมดูลธุรกิจทั้งหกเป็นแอปแยกและทำงานแบบ **standalone** ได้สำหรับร้านหรือ SME ที่ต้องการระบบปฏิบัติงานเฉพาะทาง การเชื่อม Core เป็นทางเลือก ไม่ใช่เงื่อนไขให้โมดูลใช้งานได้:

- `Micro-Business-Service` — นัดหมาย สัญญาบริการ งานบริการ ต่ออายุ และการแจ้งเตือน
- `Micro-Business-Retail` — ขายสินค้า รับชำระ สรุปยอดรายวัน และสต็อกร้านค้าทั่วไป
- `Micro-Business-Rental` — ห้องเช่า/อสังหาริมทรัพย์และสัญญาเช่าระยะยาว
- `Micro-Business-Pharmacy` — ราคาและสต็อกยา ล็อตยา วันหมดอายุ และการแจ้งเตือน
- `Micro-Business-Hotel` — จองและบริหารที่พักระยะสั้นแบบรายวัน
- `Micro-Business-FNB` — สั่งอาหารผ่าน QR, ครัว, ชำระเงิน, สต็อก และต้นทุนร้านอาหาร

### ขอบเขตข้อมูลและการเชื่อมต่อ

- โมดูลเป็นแหล่งข้อมูลปฏิบัติการต้นทางของธุรกิจนั้น เช่น รายการขาย การชำระ การจอง สัญญา การเคลื่อนไหวสต็อก และต้นทุนเฉพาะงาน
- Core เป็นแหล่งบัญชีกลางสำหรับการรวมยอด รายงานระดับบริษัท/สาขา และงานภาษี ไม่ควรสร้างรายการบัญชีซ้ำจากข้อมูลเดียวกัน
- ส่งข้อมูลเข้า Core ผ่าน API/Bridge ที่ยืนยันตัวตนและมีรหัสรายการต้นทางกับ idempotency key; ห้ามเชื่อมฐานข้อมูลข้ามแอปโดยตรง
- การส่งข้อมูลต้องระบุบริษัท สาขา เวลาเกิดรายการ สกุลเงิน และสถานะรายการให้ครบ และต้องตรวจผลลัพธ์/รายการซ้ำ/รายการที่ส่งไม่สำเร็จได้
- ใช้งาน standalone ได้แม้ไม่ได้ตั้งค่า Bridge; ห้ามทำให้การขาย การรับชำระ หรือการทำงานหน้าร้านล้มเพราะ Core ไม่พร้อม
- Bridge ปัจจุบันมีสัญญา event เช่น `order.paid` และ `payment.received`; อย่าถือว่า event เหล่านี้ครอบคลุมการส่งสต็อก ต้นทุน สัญญา การจอง หรือการแจ้งเตือน จนกว่าจะมีการออกแบบและทดสอบเพิ่ม

POS เป็นความสามารถสำหรับรับรายการขายหน้าร้าน ไม่ใช่คำเรียกระบบทั้งหมด: Core อาจมี POS/plugin สำหรับองค์กร ขณะที่ Retail และ F&B เป็นโมดูล standalone ที่มี workflow การขายเฉพาะธุรกิจของตน

---

## ฟีเจอร์ Core และโมดูลเสริม

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

### ฐานข้อมูลและการทดสอบ

- แอปใช้ PostgreSQL ผ่าน `pg` Pool ใน `lib/db.ts`; เจ้าของยืนยันว่า Neon ใช้ฝั่ง Dev และ Supabase ใช้ Production
- ก่อนรัน local dev, seed, bootstrap หรือ migration ให้ตรวจ branch ปลายทางก่อนเสมอ เพราะคำสั่งเหล่านี้อาจอ่าน/เขียนข้อมูลจริง
- งานทดสอบที่เขียนข้อมูลต้องใช้ฐาน Dev ที่แยกและทิ้งได้; migration ให้ใช้ direct URL ส่วนแอปปกติใช้ connection URL ตาม environment
- ห้ามใช้ `tests/integration/run.mjs` กับ Neon หรือฐานข้อมูลที่มีข้อมูลต้องเก็บ เพราะ harness รีเซ็ตตารางใน `mbs-integration-pg`; ใช้เฉพาะฐานข้อมูลทดสอบที่แยกและทิ้งได้

### เชื่อมต่อ Google Drive ของบริษัท

1. ตั้ง `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` และ `GOOGLE_TOKEN_ENCRYPTION_KEY` ใน environment ฝั่ง server เท่านั้น (`CLIENT_ID/SECRET` เป็นของแอป; ไม่ใช่ email หรือ credential ของผู้จัดการ)
2. ตั้ง Authorized redirect URI ใน Google Cloud ให้ตรงกับ `GOOGLE_REDIRECT_URI` (เช่น `https://your-domain.example/api/google-drive/callback`) และเปิด Drive API กับ Sheets API
3. สร้างคีย์เข้ารหัส 32 bytes ด้วย `openssl rand -base64 32`; เก็บเป็น secret ที่ `GOOGLE_TOKEN_ENCRYPTION_KEY` และใช้ค่าเดิมต่อเนื่องทุก deployment เพื่อถอดรหัส refresh token ที่จัดเก็บไว้
4. รัน DB bootstrap/migrations ก่อน deploy feature นี้; migration แบบ one-time จะล้าง OAuth credentials เก่าที่เป็น plaintext เพื่อบังคับให้แต่ละบริษัทเชื่อมต่อใหม่
5. ผู้ดูแลบริษัทเข้า Settings → Google Drive → “เชื่อมต่อด้วย Google” และอนุญาตด้วยบัญชีผู้จัดการบริษัท

OAuth callback URL ต้องเป็น HTTPS ใน production และต้องตั้ง Google OAuth consent screen / publishing status สำหรับผู้ใช้จริง หาก Google app ยังอยู่ใน Testing การอนุญาตอาจมีข้อจำกัดหรือ refresh token หมดอายุตามนโยบายของ Google

เอกสารและ Spreadsheet จะอยู่ใน Drive ของบัญชี Google ที่หน้าเชื่อมต่อแสดง อีเมลบัญชีจะแยกเก็บตามบริษัท; ระบบไม่ใช้ refresh token กลางหรือ service account สำรอง หากยังไม่เชื่อมต่อหรือ credential ไม่ถูกต้อง การส่งไฟล์จะล้มเหลวพร้อมแจ้งข้อผิดพลาด ไม่ย้ายไปบันทึกที่ Drive ของบริษัทอื่น

`NEXT_PUBLIC_GOOGLE_CLIENT_ID` และ `NEXT_PUBLIC_GOOGLE_API_KEY` ใช้เฉพาะ Google Drive Picker ฝั่ง browser; client ID นี้ต้องตรงกับ `GOOGLE_CLIENT_ID` แต่ไม่ใช่ข้อมูลยืนยันตัวตนของบัญชีบริษัท. การเลือกไฟล์ใน Picker ปัจจุบันบันทึกเป็นลิงก์อ้างอิง ไม่ได้คัดลอกไฟล์เข้า Drive บริษัท; การอัปโหลดไฟล์จากเครื่องและการสร้างเอกสารใช้ Drive ของบัญชีบริษัทที่เชื่อมต่อ

หลัง deploy ให้ลบ `GOOGLE_REFRESH_TOKEN` รุ่นเก่าออกจาก environment หากเคยตั้งไว้; migration ล้าง token/client secret แบบเดิมใน `company_settings` เพียงครั้งเดียวและบริษัทต้อง authorize ใหม่

---

## ส่งมอบแอพแบบ Docker โดยใช้ PostgreSQL ภายนอก

```bash
cp .env.example .env.local

# 1) ออก license ให้ลูกค้า (ฝั่งผู้ขาย — sign ด้วย LICENSE_SALT ตัวเดียวกับฝั่ง app)
node scripts/issue-license.mjs \
  --mode perpetual --company "ชื่อลูกค้า" --licensee "อีเมลลูกค้า" \
  --max-users 5

# 2) ใส่ค่าจริงใน .env.local:
#    LICENSE_SALT   = salt เดียวกับฝั่งผู้ขาย
#    MBS_LICENSE_KEY = license key ที่ออกให้ลูกค้ารายนี้
#    DATABASE_URL   = PostgreSQL URL ของ environment เป้าหมาย
#    NEXTAUTH_SECRET = random JWT secret (โค้ดยังรองรับ AUTH_SECRET เป็น fallback)
#    NEXTAUTH_URL = URL จริงที่ผู้ใช้เปิดเว็บ (เช่น http://localhost:3000 สำหรับ local)
#    GOOGLE OAuth values = ตั้งเมื่อเปิดใช้ Google Drive integration

# 3) รัน app container (เชื่อม PostgreSQL ภายนอก; ไม่มี PostgreSQL ภายใน Compose)
docker compose --env-file .env.local up -d --build
```

- เปิดแอพที่: `http://localhost:3000`
- ฐานข้อมูลภายนอกต้องมี schema และ migrations ที่แอพต้องใช้ก่อนเริ่มใช้งาน; Compose จะไม่สร้างหรือ migrate schema ให้อัตโนมัติ
- ก่อน migration ให้สำรองข้อมูลและทดสอบบนฐานแยกที่ทิ้งได้ของ environment เป้าหมาย ใช้ direct URL กับเครื่องมือ migration; อย่าชี้ bootstrap ไปยัง production โดยไม่ตรวจ SQL และอนุมัติการเปลี่ยนแปลงก่อน
- สร้าง admin ครั้งแรก: หน้า `/register` → register แล้วกด `promote` เป็น superadmin
- **license lock:** production (`docker compose`) จะ fail-fast ถ้า `MBS_LICENSE_KEY` ผิด/หมดอายุ (subscription) — perpetual ไม่หมดอายุ, subscription หมดอายุเมื่อถึง `expires_at`
- โหมดการขาย: `PRODUCT_MODE=perpetual` (ขายขาด) หรือ `PRODUCT_MODE=subscription` (เช่า รายเดือน)

---

## เทคนิค

- **Stack:** Next.js 16 (App Router) + React 19 + TypeScript 5
- **UI:** Tailwind CSS 4 + lucide-react
- **ฐานข้อมูล:** PostgreSQL ผ่าน `pg` Pool (`lib/db.ts`); environment Dev ใช้ Neon และ Production ใช้ Supabase ตามการกำหนดปัจจุบัน
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