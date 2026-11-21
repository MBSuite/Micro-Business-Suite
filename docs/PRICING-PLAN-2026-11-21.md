# แผนกำหนดราคา MBSuite — subscription launch (2026-11-21)

> สถานะ: **ข้อเสนอสำหรับตัดสินใจ** ยังไม่ได้ใช้เรียกเก็บลูกค้าจริง
> แหล่งข้อมูล: `lib/license-packages.ts` (tier/limit จริงในโค้ด), `docs/COMPETITOR-COMPARISON-MBS.md`,
> `docs/COMPETITOR-ANALYSIS-FLOWACCOUNT.md`, `docs/CAPABILITY_AUDIT.md`, `docs/LICENSE_STANDARD.md`
> ตรวจล่าสุด 2026-11-21 — ราคาคู่แข่งควร re-check อีกครั้งก่อนโฆษณาสาธารณะ

---

## 1. สมมติฐานที่ใช้ตัดสินใจ

- ลูกค้าเป้าหมาย: **SME ไทย 1–20 ผู้ใช้** ต้องการระบบบัญชี/ภาษีที่ใช้งานง่ายไม่ต้องพึ่งนักบัญชีมาช่วยบันทึกรายการทุกวัน
- โหมดขาย: **subscription ก่อน** (ตามที่เจ้าของผลิตภัณฑ์ตัดสิน 2026-11-21), เรียกเก็บเป็น THB
- ช่องทาง: self-serve + ขายแบบเบา ๆ (negotiation น้อย)
- **ไม่ตั้งราคาจาก "9 repo / 2 สัปดาห์"** — เวลาพัฒนาเป็น floor ของต้นทุน ไม่ใช่เหตุผลที่ลูกค้าจ่าย
- ราคาตั้งอยู่ระหว่าง **ทางเลือกที่ลูกค้ามีอยู่แล้ว** (FlowAccount Pro ฿299/ด., Pro Business ฿549/ด.)
  กับ **คุณค่าที่ MBS ให้เพิ่ม** (AI audit + tax automator + Google auto-backup/Sheets/Calendar + RD API + เปิด-ปิดโมดูลได้)

คู่แข่งจากเอกสารใน repo (ข้อมูล 2026-11):
- FlowAccount: Free → Standard ฿199 (รายปี ≈฿165) → Pro ฿299 (≈฿249) → Pro Business ฿549 (≈฿457) + add-on แยก, annual discount 17%, trial ไม่ระบุชัด
- AccCloud: คิดตามผู้ใช้ + **ค่าติดตั้ง 9,000 บาทครั้งเดียว**, trial 30 วัน, ไม่มี free tier

---

## 2. แพ็กเกจและราคา

ใช้ tier ที่มีอยู่แล้วใน `lib/license-packages.ts` **ไม่ต้องเพิ่มโค้ดหรือ migration**

| Tier | ผู้ใช้ | ธุรกรรม/เดือน | ฟีเจอร์หลัก | รายเดือน | รายปี (ลด ~17%) |
|---|---|---|---|---|---|
| `TRIAL` | 1 | 30 | ฟีเจอร์หลัก, หมดอายุ 30 วัน | ฟรี | — |
| `STANDARD` | 3 | 500 | basic + journal + tax + COA | **฿299** | ฿2,990 (~฿249/ด.) |
| `PROFESSIONAL` ⭐ แนะนำ | 5 | 2,000 | + advanced reports + automated journaling | **฿699** | ฿6,990 (~฿582/ด.) |
| `ENTERPRISE` | 20 | 10,000 | + multi-company + api_access + custom_branding | **฿1,499** | ฿14,990 (~฿1,249/ด.) |
| `AUDIT` | — | — | superadmin-only, `is_audit=true` | **ขายไม่ได้** | — |

เหตุผลของระดับราคา:
- ไม่ undercut ฿199 — ราคาต่ำเกินไปได้ "ยอดสมัคร" ที่ไม่ใช่ลูกค้าจ่ายจริง และขึ้นราคาทีหลังยากมาก
- `PROFESSIONAL` ฿699 สูงกว่า Pro Business ฿549 ของคู่แข่งเล็กน้อย มีเหตุผลรองรับ: AI ตรวจผิดปกติ + tax automator + Google automation + RD API
- หน้าราคาควรโชว์ `ENTERPRISE` เป็น anchor ด้านบน แล้ว highlight `PROFESSIONAL` เป็น "คุ้มที่สุด"

## 3. Value metric (สิ่งที่คิด money ตาม)

**Hybrid: seat + usage band** — ใช้ `max_users` และ `max_transactions_per_month` ที่มีอยู่แล้ว
- gating บังคับจริงใน `app/actions/invoices.ts`, `quotations.ts`, `vouchers.ts`, `app/expense-actions.ts`, `app/api/pos/checkout/route.ts` (ผ่าน `lib/company-gate.ts::assertCompanyQuota`)
- ยังไม่ทำ per-transaction meter: วัดยาก ตรวจยาก และลูกค้าเล่นได้

## 4. วิธีปล่อย pilot ให้เพื่อนทดสอบ

- ใช้ **trial 30 วันตามระบบเดิม** — ไม่ให้ free lifetime, ไม่ทำ Free tier
- **Founding price เฉพาะ 10 รายแรกที่จ่ายในเดือนแรก:** `PROFESSIONAL` ฿499/ด. หรือ ฿5,490/ปี
  **ล็อก 12 เดือน** แล้วกลับเข้าราคาปกติ 699 — grandfather แบบมีกำหนด ไม่ใช่ตลอดชีพ
- ขึ้นราคาครั้งหน้าให้ **ลูกค้าใหม่ก่อน** ดู conversion 1 cycle ค่อยขยับของเดิม 5–10% ต่อคลื่น

## 5. Blockers ก่อนให้เพื่อนลองจริง

1. **`PRODUCT_MODE` บน Vercel ต้องเป็น `subscription`** — ค่า default/current local คือ `perpetual`;
   ถ้า production เป็น `perpetual` subscription key ที่ออกให้ลูกค้าจะ `verifyLicenseKey()` ไม่ผ่านทันที
   (ดู `docs/LICENSE_STANDARD.md` § "PRODUCT_MODE") → ลูกค้าจ่ายเงินแล้วเข้าไม่ได้
2. `MBS_CORE_URL` + `MBS_ADMIN_LICENSE_TOKEN` ต้องตรงกันทั้ง Core และ micro-admin
   (ไม่งั้น `/admin/licenses` fail closed 503/401), `LICENSE_SALT` ต้องเป็นค่าเดิมที่ใช้เซ็น key
3. ตอน ISSUE key จริงต้องมี `price_amount` / `price_currency` — micro-admin ผลิตฟอร์มเติมอัตโนมัติตาม tier
   จาก `lib/license-pricing.ts` (299/699/1,499 THB ต่อเดือน,แก้ได้ในฟอร์ม) และส่งผ่าน bridge ไป write ใน Core
   (ของเดิมเช่น company 12 ที่ออกไปแล้วไม่ถูกแก้ — ต้องอนุมัติ DML เพิ่มถ้าจะปรับย้อนหลัง)
4. ตัดสินใจว่าราคาที่โชว์ **รวม VAT 7% หรือไม่** — แนะนำแสดง "ยังไม่รวม VAT 7%" ให้ชัด

## 6. ข้อมูลที่ยัง MISSING (ไม่เดา ต้องได้จากเจ้าของผลิตภัณฑ์)

- ต้นทุนคงที่ต่อเดือน (Vercel + Neon + Google API) และชั่วโมง support ต่อลูกค้า
  → break-even = `fixed cost ÷ (price − variable cost)`; ยังคำนวณไม่ได้จนกว่าจะได้ตัวเลข
- CAC / conversion / churn / ARPU: **MISSING** (ยังปล่อยใหม่)
- ผล Van Westendorp / MaxDiff: **MISSING** → ราคาข้างบนคือ bet ที่จะเรียนรู้ ไม่ใช่ราคาที่ optimize แล้ว

## 7. วิธีวัดผล 2 สัปดาห์แรก

- ถามเจ้าของ SME 10–15 คนด้วย Van Westendorp 4 คำถาม (แพงเกิน / ถูกเกิน / แพงแต่ลองได้ / ถูกมาก)
  ตัดสินจาก **"จ่ายจริงไหม"** ไม่ใช่ "ชอบไหม"
- ทดสอบ 699 vs 899 เฉพาะ **ลูกค้าใหม่** ดู conversion ของการจ่าย ไม่ใช่จำนวนสมัคร
- สัญญาณว่าขึ้นราคาได้: conversion > 40%, ไม่มีใครต่อราคา, churn < 3%/เดือน → ขยับ +20–30%

---

## 8. อธิบาย "ข้อ 6 จากคำตอบก่อนหน้า" (สามอย่างที่ห้ามทำ)

ในคำตอบก่อนหน้าผมสรุปไว้สั้น ๆ ว่า "อย่าขายฟีเจอร์ที่ยังเป็น gap / อย่าตั้งราคาต่ำ / อย่าขายสองโหมดใน deployment เดียว"
ขออธิบายแต่ละข้อแบบตรงไปตรงมาพร้อมเหตุผลจากโค้ดและเอกสารจริง:

### 8.1 อย่าขายฟีเจอร์ที่ยังไม่มีจริง

`docs/CAPABILITY_AUDIT.md` บันทึกไว้ชัดว่าเป็น **gap** (ยังไม่มีตาราง/โค้ดรองรับ):
POS checkout แบบสแกนบาร์โค้ด + โปรโมชัน + ชำระหลายรูปแบบ, inventory แบบ variant/auto-deduct/หลายสาขา,
CRM loyalty, F&B (โต๊ะ/KOT/BOM), เชื่อม Shopee/Lazada/Delivery

**ทำไมห้าม:** ถ้าโฆษณาว่ามีแล้วลูกค้าจ่าย พบว่าไม่มี → ขอ refund, รีวิวเชิงลบ, support ถล่ม
และเสียความน่าเชื่อถือก่อนจะได้ลูกค้าแรกเสียอีก

**สิ่งที่ขายได้ตอนนี้ตามของจริง:** บัญชี/เอกสาร (ใบเสนอราคา→วางบิล→ส่งสินค้า/ภาษี→ใบเสร็จ),
journals, COA, tax reports, P&L/cashflow, AI auditor, tax automator, Google backup/Sheets/Calendar,
RD-ready, เปิด-ปิดโมดูล, perpetual/subscription ตามที่ตั้งค่า

### 8.2 อย่าตั้งราคาต่ำเพื่อ "ให้คนเข้าก่อน ค่อยขึ้นทีหลัง"

นี่คือกับดัก $9/199:
- คนที่สมัครเพราะราคาถูก **ไม่ได้พิสูจน์ว่าคุณค่าของเราพอให้เขาจ่าย** → ได้ false traction
- ลูกค้ากลุ่มนี้มัก churn สูงสุดและ complaint ดังที่สุด
- **ขึ้นราคาทีหลังยากกว่าตั้งราคาสูงตั้งแต่แรก 5–10 เท่า** และ labor costs เพิ่มขึ้นเรื่อย ๆ

**ทางเลือกที่ถูกต้อง:** ใช้ trial 30 วัน (ฟรีแต่มีเงื่อนไขเวลา) หรือ founding price แบบล็อก 12 เดือน
— ลดเพื่อให้ลองได้ แต่ **ไม่ลดแบบไม่มีกำหนด**

### 8.3 อย่าขาย perpetual และ subscription ใน deployment เดียว

`lib/product-mode.ts` อ่าน `PRODUCT_MODE` จาก env (default = `perpetual`)
และ `lib/license.ts::verifyLicenseKey()` **ปฏิเสธ subscription key ทันทีเมื่อ mode เป็น perpetual**
(ระบุไว้ใน `docs/LICENSE_STANDARD.md` § PRODUCT_MODE risk)

**ผลที่ตามมาถ้าผิด:** เราออก subscription key ให้ลูกค้า → จ่ายเงินแล้ว → key verify ไม่ผ่าน → เข้าแอปไม่ได้
และแก้ด้วยการ "ส่ง key ใหม่" ก็ไม่ช่วยจนกว่าจะเปลี่ยน mode

**ทางเลือกที่ปลอดภัยตอนนี้:** เลือก **หนึ่งโหมดต่อ deployment** — สำหรับการปล่อยสัปสไคร์ครั้งนี้ให้ตั้ง
`PRODUCT_MODE=subscription` บน Core Vercel แล้วออกแต่ subscription key
ถ้าภายหลังต้องการขายขาดควบคู่ ให้แยก deployment/domain หรือแก้ verify logic เป็นงานใหม่ที่ต้องอนุมัติก่อน
(ห้ามแก้เองขณะกำลังจะปล่อย)

---

## 9. Checklist ก่อนโพสต์ราคาสาธารณะ

- [ ] ตั้ง `PRODUCT_MODE=subscription` บน Core Vercel (พี่ฆังทำใน Dashboard — AI ห้าม login Vercel)
- [ ] ตั้ง `MBS_CORE_URL` + `MBS_ADMIN_LICENSE_TOKEN` ให้ตรงกันทั้ง 2 repo
- [ ] ทดสอบ ISSUE → VERIFY กับ subscription key 1 ใบบน production จริง
- [ ] กรอก `price_amount`/`price_currency` ใน license ที่ออก
- [ ] ระบุ VAT ให้ชัดบนหน้าราคา
- [ ] re-check ราคา FlowAccount/AccCloud ล่าสุด
- [ ] หน้าราคาแสดง tier เป็น text ที่ AI/agent อ่านได้ (ไม่ฝังในภาพ)
