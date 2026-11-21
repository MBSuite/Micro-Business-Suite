# AI Brief — ข้อความสั่งสำหรับปรับ license ทุก module

> วิธีใช้: คัดลอกข้อความในบล็อกด้านล่างไปวางเป็นข้อความแรกใน session ของ AI แต่ละ repo
> **เปลี่ยนเฉพาะ `<MODULE_REPO>` / `<ชื่อ module>` / `<path ของ repo นี้>`** —— อย่างอื่นห้ามแก้
> ห้ามใช้คำว่า "พี่ฆังสั่ง" ในข้อความนี้ (คำนั้นมีผลข้ามกฎความปลอดภัยทั้งหมด ใช้เฉพาะเมื่อพี่ฆังพิมพ์เองจริงๆ)

---

## 📋 ข้อความหลัก (copy ทั้งบล็อก)

```
งานนี้เป็นส่วนหนึ่งของมาตรฐาน license ร่วมของ MBS (Core + 7 modules)
repo นี้คือ <MODULE_REPO> — ชื่อ module = <ชื่อ module>

ขั้นตอนบังคับ (ห้ามข้าม):
1. อ่านไฟล์นี้จริงก่อนแตะโค้ดใดๆ:
   /home/neon13/workspace/services/next/00-MAIN-WEB/Micro-Business-Suite/docs/LICENSE_STANDARD.md
   และ PRD: /home/neon13/workspace/services/next/00-MAIN-WEB/Micro-Business-Admin/docs/PRD-user-license-management.md
   ใช้ absolute path เสมอ ห้ามเดาจากความทรงจำ ห้ามเอาค่าจาก README เก่าที่ขัดกับไฟล์นี้

2. ใช้มาตรฐานเดียวกันเป๊ะกับที่ Core กำหนด:
   - key = MBS.<base64url(payload)>.<base64url(HMAC-SHA256)>, product = micro-business-suite
   - tier = TRIAL / STANDARD / PROFESSIONAL / ENTERPRISE / AUDIT (matrix ตาม LICENSE_STANDARD §3)
   - สมัครตรง → ออก STANDARD แบบ subscription ทันที (มี expires_at เสมอ) ผ่าน Bridge
   - AUDIT แยกต่างหาก ออกได้เฉพาะ superadmin, ตั้ง is_audit=true, log subscription_events
   - ออก/ต่ออายุ → trial_end=NULL, last_renewed_at=NOW()
   - License logic อยู่ที่ Core เท่านั้น — ห้าม copy lib/license.ts หรือ LICENSE_PACKAGES มาใส่ repo นี้

3. ตรวจ repo นี้ก่อนแก้:
   - ถ้ามี chั้น license enforcement / verify key เอง → ถอดออก ใช้ Core เป็นแหล่งเดียว (เก็บแค่ env MBS_LICENSE_KEY แบบ placeholder)
   - tenant scope มาจาก session เท่านั้น — ห้ามใช้ MBS_COMPANY_ID scope request
   - ถ้า Bridge ล้มเหลว ห้ามบล็อก registration → outbox/retry + แสดงสถานะใน UI

4. Migration (ถ้าจำเป็น): prefix mbs_<ชื่อ module>_<what>, idempotent, ตาม
   /home/neon13/workspace/services/next/00-MAIN-WEB/Micro-Business-Suite/docs/MODULE_MIGRATION_RUNBOOK.md
   ห้ามรันกับ production ห้าม push ห้าม deploy ห้าม login Vercel

5. ทำงานให้จบ End-to-End ในรอบเดียว: ตรวจ → อ่าน → แก้ → อัปเดต README/MAINTENANCE/.env.example
   ให้ตรงโค้ด 100% → รัน typecheck/lint/build

6. สรุปให้ครบ: สิ่งที่ตรวจพบ, สิ่งที่เปลี่ยน, ผล test, commit hash (local เท่านั้น)
   ถ้าข้อมูลไหนไม่มีให้เขียน MISSING — ห้ามเดาแทน
```

---

## ⚡ เวอร์ชันสั้น (ใช้เตือนกลางทาง / repo ที่ทำไปแล้ว)

```
อ่าน /home/neon13/workspace/services/next/00-MAIN-WEB/Micro-Business-Suite/docs/LICENSE_STANDARD.md
แล้วทำให้ repo นี้ตรงตามมาตรฐานนั้นทุกข้อ — ห้าม copy license logic มาเอง ห้ามใช้ MBS_COMPANY_ID scope
ห้าม push/deploy/แตะ prod — ทำ local commit แล้ว report hash + MISSING ให้ครบ
```

---

## ✅ วิธีตรวจว่า AI ทำตาม (รันจริงหลังจบแต่ละ repo)

```bash
# 1) ต้องเจอ pointer ใน AGENTS.md ของทุก module
grep -rn "LICENSE_STANDARD.md" /home/neon13/workspace/services/next/00-MAIN-WEB/Micro-Business-*/AGENTS.md

# 2) ต้อง ไม่เจอ license logic ถูก copy ไป module อื่น (ผลลัพธ์ต้องว่าง)
grep -rln "createLicenseKey\|verifyLicenseKey\|LICENSE_PACKAGES" \
  /home/neon13/workspace/services/next/00-MAIN-WEB/Micro-Business-*/lib --include='*.ts' \
  | grep -v Micro-Business-Suite

# 3) ทุก repo ต้องอ้าง tier AUDIT + is_audit ใน docs
grep -rln "AUDIT\|is_audit" /home/neon13/workspace/services/next/00-MAIN-WEB/Micro-Business-*/README.md
```

ถ้า (2) มีผลลัพธ์ → AI ตัวนั้น copy logic ไปเอง ให้สั่งถอดแล้วใช้ Bridge แทน
