---
name: "Project Risk Audit"
description: "วิเคราะห์โครงการและค้นหาความเสี่ยงด้านความปลอดภัย ข้อมูล บัญชี ภาษี การปฏิบัติงาน และคุณภาพโค้ด โดยอ้างอิงหลักฐานจากไฟล์จริง"
argument-hint: "ระบุขอบเขตหรือไฟล์ที่ต้องการตรวจ เช่น auth, API, ภาษี, หรือทั้งโครงการ"
agent: "agent"
---

วิเคราะห์โครงการปัจจุบันและค้นหาความเสี่ยง โดยตอบเป็นภาษาไทย คงชื่อไฟล์ path symbol และคำสั่งภาษาอังกฤษตามที่ปรากฏในโค้ด

## ขอบเขตอินพุต

ผู้ใช้จะระบุขอบเขต ไฟล์ ชุดการเปลี่ยนแปลง หรือ threat model เพิ่มเติมได้ หากไม่ระบุ ให้ตรวจทั้ง repository โดยเริ่มจากโค้ดและเอกสารที่เกี่ยวข้องโดยตรง ไม่สรุปจากชื่อไฟล์เพียงอย่างเดียว

## ขั้นตอนตรวจสอบ

1. อ่านกฎและเอกสารอ้างอิงของโครงการก่อน ได้แก่ `AUTH_RULES.md`, `CORE_RULES.md`, `docs/RBAC_STANDARD.md`, `docs/ARCHITECTURE.md`, `docs/BUSINESS_RULES.md`, `docs/THAI_TAX_GUIDE.md`, `scripts/README.md` และ `package.json`.
2. เมื่อเอกสารขัดแย้งกัน ให้ระบุความขัดแย้งและให้น้ำหนักกับกฎที่ระบุว่าเป็น canonical/current รวมถึงพฤติกรรมในโค้ดจริง ห้ามเลือกคำตอบโดยเดา.
3. ตรวจ authentication แยกจาก authorization, UI visibility, object ownership และ company/tenant scope. อย่าถือว่า `proxy.ts` ที่ตรวจ session เพียงอย่างเดียวเพียงพอสำหรับสิทธิ์ของ route.
4. ตรวจ `app/api/**`, `app/actions/**`, server actions และ privileged routes โดยพิจารณา auth, permission, input validation, ownership/company scope, transaction boundary, idempotency, audit logging และ error disclosure.
5. ตรวจ database และ data integrity: `scripts/CURRENT_SCHEMA_MASTER.sql`, migrations, runtime `ALTER TABLE`/`CREATE TABLE`, foreign keys, uniqueness, race conditions, partial writes, destructive deletes, sequence resets และ schema drift.
6. ตรวจ accounting, tax และ payroll โดยเทียบ `lib/tax.ts`, `lib/taxAutomator.ts`, `lib/journaling.ts`, `lib/reports.ts`, `lib/payroll.ts` กับ `docs/BUSINESS_RULES.md`, `docs/THAI_TAX_GUIDE.md`, form references และ accounting invariants. ระบุสิ่งที่ต้องยืนยันโดยผู้เชี่ยวชาญภาษีแยกจาก defect ทางโค้ด.
7. ตรวจ secrets และ integrations เช่น environment variables, JWT/cookie settings, Google OAuth/Drive, external Revenue Department APIs, backup/export, Docker และ deployment. ห้ามแสดงค่าความลับหรือข้อมูลส่วนบุคคลในรายงาน.
8. ตรวจ tests และ validation โดยอ่าน scripts ใน `package.json` และยืนยันว่า test ที่มีอยู่ถูกรันจริงหรือไม่. แยก unit coverage จาก integration/e2e coverage.
9. รันเฉพาะคำสั่งตรวจสอบที่ปลอดภัยและเกี่ยวข้อง เช่น `pnpm lint`, `pnpm test`, `pnpm check:knowledge`, `pnpm check:consistency` และ `pnpm build` ตามความเหมาะสม. หากคำสั่งรันไม่ได้ ให้บันทึกสาเหตุและอย่าอ้างว่ายืนยันแล้ว.

## การจัดประเภท finding

ทุก finding ต้องมีข้อมูลต่อไปนี้:

- **Severity:** Critical, High, Medium, Low หรือ Informational
- **สถานะ:** ยืนยันแล้ว, มีแนวโน้มสูง หรือยังยืนยันไม่ได้
- **ประเภท:** Security, Authorization, Data Integrity, Accounting/Tax, Availability, Privacy, Operations, Maintainability หรือ Test Gap
- **ผลกระทบ:** ใครหรือข้อมูลใดได้รับผลกระทบ และเกิดอะไรขึ้นได้
- **หลักฐาน:** ลิงก์ไฟล์และ symbol/route/function ที่ตรวจพบ ห้ามสร้างตำแหน่งที่ไม่มีจริง
- **เส้นทางการเกิดปัญหา:** อธิบายลำดับ input/request/state ที่ทำให้เกิดความเสี่ยง โดยไม่เปิดเผย secret และไม่ทำลายข้อมูล
- **ข้อเสนอแนะ:** แนวทางแก้ที่สั้นและจัดลำดับความสำคัญได้
- **วิธีตรวจยืนยัน:** test หรือ command ที่ควรเพิ่มหรือรันเพื่อยืนยันข้อสรุป

อย่ารายงานเพียงการมีอยู่ของ pattern ว่าเป็นช่องโหว่ทันที ให้ตรวจ control flow, caller, validation และ deployment context ก่อน หากหลักฐานไม่พอให้รายงานเป็นข้อสงสัยพร้อมระบุสิ่งที่ขาดหายไป

## รูปแบบผลลัพธ์

ใช้โครงสร้างนี้และเรียง findings จากความรุนแรงสูงไปต่ำ:

# สรุปการตรวจสอบ

- ขอบเขตและวันที่ตรวจ
- ภาพรวมความเสี่ยง
- จำนวน findings แยกตาม severity และสถานะ

# Findings

สำหรับแต่ละรายการใช้รูปแบบ:

## [SEVERITY] ชื่อประเด็น

- สถานะ:
- ประเภท:
- ผลกระทบ:
- หลักฐาน:
- เส้นทางการเกิดปัญหา:
- ข้อเสนอแนะ:
- วิธีตรวจยืนยัน:

# จุดที่ตรวจแล้วไม่พบปัญหาชัดเจน

ระบุเฉพาะ control หรือพื้นที่ที่มีหลักฐานรองรับ ห้ามใช้เป็นคำรับรองความปลอดภัยทั้งหมด

# ช่องว่างและข้อจำกัด

ระบุไฟล์ ระบบภายนอก environment ข้อมูล production หรือ integration tests ที่ไม่สามารถตรวจได้ รวมถึง assumptions และคำถามที่ต้องให้เจ้าของระบบตอบ

# คำสั่งและผลการตรวจ

แสดงเฉพาะคำสั่งที่รันจริง สถานะ และผลสรุปสั้น ๆ หากไม่ได้รันให้ระบุว่าไม่ได้รันพร้อมเหตุผล

อย่าแก้ไขไฟล์แอปพลิเคชันหรือสร้าง patch เว้นแต่ผู้ใช้จะขอให้แก้ไขโดยตรง งานนี้มีหน้าที่วิเคราะห์และรายงานความเสี่ยงเท่านั้น
