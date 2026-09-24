---
name: mbs-admin-access
description: สำหรับโปรเจกต์ Micro-Business-Suite — ใช้เมื่อผู้ใช้หา user/password ของ superadmin, ถาม "admin รหัส", "ขอผู้ใช้ admin", seed admin, ต้องการเข้าดู /admin/customers (Customer & Subscription Console), หรือวนกับเมนู admin/superadmin ที่ require. บอกตำแหน่ง credential ไฟล์ที่เก็บ, วิธีรีเซ็ตรหัสอย่างปลอดภัย (ไม่พิมพ์ secret), และวิธีเปิด dev server ท้องถิ่นเพื่อทดลองหน้า admin. อย่าใช้กับโปรเจกต์อื่นหรือเพื่อเปลี่ยน role ของ user ธรรมดา.
version: 0.1.0
license: MIT
compatibility: opencode
category: Development Workflow
metadata:
  audience: developers
  keywords: superadmin, admin, credential, seed, customer-console, reset-password
  workflow: local
---

# mbs-admin-access

แนวทางหาตัวตน superadmin และการเข้าถึงฟีเจอร์ admin ของ Micro-Business-Suite
(console `/admin/customers` เป็น superadmin เท่านั้น) โดยไม่เผลอพิมพ์ secret ลงแชต/command
และไม่แก้อะไรใน production ที่ไม่ได้สั่ง

## When to use this skill

- ผู้ใช้ขอ user/password ของ admin/superadmin หรืออยากดูฟีเจอร์ admin
- ต้องการเข้าถึง `/admin/customers` / API `api/admin/customers*`
- สงสัยว่า seed superadmin ทำไปแล้วหรือยัง / credential อยู่ไหน
- เปิด dev server ท้องถิ่นเพื่อทดลอง (พอร์ตที่ถูกต้อง 3001)

## When NOT to use it

- โปรเจกต์อื่นที่ไม่ใช่ Micro-Business-Suite
- เปลี่ยน role ของ user ธรรมดาให้เป็น admin (งานนี้ต้องขออนุมัติownerก่อน)
- งาน seed data ทั่วไปที่ไม่เกี่ยวกับ admin

## Gotchas

- บัญชี superadmin เดิมมีอยู่แล้ว: **`admin@mbsuite.app`** (id=1, role=superadmin, company_id=1)
  — seeded ตั้งแต่ bootstrap ครั้งแรกของแพลตฟอร์ม
- `scripts/bootstrap-seed-admin.mjs` **skip ทันที** ถ้าอีเมลนี้มีอยู่แล้ว
  (ไม่สร้างไฟล์ credential ใหม่) → ใช้ไม่ได้สำหรับ "ขอรหัสใหม่"
- ไฟล์ `.secure/initial-admin-credential.txt` (mode 0600) ถูก `.gitignore` ละเว้น
  อยู่แล้ว (.gitignore บรรทัด `.secure/`) — เขียนรหัสใหม่ได้ที่นี่แต่ต้องไม่ commit
- `lib/db.ts` ต้องการ `POSTGRES_URL` หรือ `DATABASE_URL` — อ่านจาก `.env.local`
  ดังนั้น script ทุกตัวต้อง `config({ path: ".env.local" })` **ก่อน** `import "./lib/db.ts"`
- คำเตือน `MODULE_TYPELESS_PACKAGE_JSON` + `Reparsing as ES module` เป็น noise ไม่กระทบ
- dev server ท้องถิ่น: **พอร์ต 3000 ถูก service `open-webui` ครอบอยู่** (uvicorn)
  → ใช้ **3001** เสมอ; เปิดด้วย `setsid nohup` (bash tool ฆ่าทั้ง process group) ×
  build ตอน kill ให้ใช้ `node node_modules/next/dist/bin/next dev` ตรงๆ เพื่อ kill ได้จริง
- ห้ามพิมพ์รหัส/secret เต็มลง chat, กรอก command ที่ถูกบันทึก (opencode.log) —
  คุยกับผู้ใช้เท่านั้นด้วย path + `password_len`

## Technique / Steps

### ตัวแปรที่ต้องตั้ง (โปรเจกต์ root)
- ROOT = ไดเรกทอรีรากของโปรเจกต์นี้
- `ADMIN_EMAIL = admin@mbsuite.app`

### 1) ตรวจว่ามี superadmin อยู่แล้วและได้ไฟล์ credential หรือไม่
```bash
ls -la .secure/ # ถ้ามี initial-admin-credential.txt -> บอก path ให้ผู้ใช้ อย่า cat
node --input-type=module -e '
import { config } from "dotenv";
config({ path: ".env.local" });
const { query } = await import("./lib/db.ts");
const r = await query("SELECT id, email, role, status, company_id FROM users WHERE role = $1 OR email = $2", ["superadmin", "admin@mbsuite.app"]);
for (const x of r.rows) console.log(`- ${x.email} id=${x.id} role=${x.role} status=${x.status}`);
process.exit(0);
' # อย่าพิมพ์คอลัมน์ password
```

### 2) ถ้าไม่มี credential และต้องการรหัส — Reset (ต้องได้รับอนุมัติก่อน เพราะแก้ prod DB)
```bash
node --input-type=module -e '
import { config } from "dotenv";
config({ path: ".env.local" });
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
const { query } = await import("./lib/db.ts");
const EMAIL = "admin@mbsuite.app";
const existing = await query("SELECT id FROM users WHERE email = $1", [EMAIL]);
if (existing.rows.length !== 1) { console.error("ABORT"); process.exit(1); }
const password = crypto.randomBytes(16).toString("hex");
const hash = await bcrypt.hash(password, 10);
const up = await query("UPDATE users SET password = $1 WHERE email = $2", [hash, EMAIL]);
if (up.rowCount !== 1) { console.error("ABORT update"); process.exit(1); }
const dir = path.join(process.cwd(), ".secure");
fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
const f = path.join(dir, "initial-admin-credential.txt");
fs.writeFileSync(f, `EMAIL=${EMAIL}\nPASSWORD=${password}\n`, { mode: 0o600 });
console.log(`[RESET] ok email=${EMAIL} id=${existing.rows[0].id} password_len=${password.length}`);
console.log(`[SECURITY] credentials at ${f} (0600). Full password NOT printed.`);
process.exit(0);
'
```
รายงานผู้ใช้: email + path ไฟล์ + `password_len` ห้ามพิมพ์รหัสเต็ม

### 3) เปิด dev server ท้องถิ่น (สำหรับทดลองหน้า admin)
```bash
ss -tlnp | grep ":3000 " # จะเห็น open-webui -> ใช้ 3001
setsid nohup node node_modules/next/dist/bin/next dev -p 3001 \
  >/tmp/opencode/mbs-dev-3001.log 2>&1 < /dev/null & # แล้วปิดเมื่อเสร็จโดย kill PID เฉพาะ
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/ # 307 = พร้อม (redirect ล็อกอิน)
```
URL: `http://localhost:3001` → ล็อกอินด้วย credential ที่ reset → ไป `/admin/customers`

## Rules

- กฎ #1: ห้ามเดา — ตรวจ DB จริงก่อนสรุป
- กฎ #2: ห้ามพิมพ์ token/key/password เต็มลง chat หรือ command
- การ reset เปลี่ยนข้อมูลจริงใน prod DB → ต้องได้อนุมัติ owner ก่อนเสมอ
- `.secure/` ต้องอยู่ใน .gitignore เสมอ ไม่ commit ไฟล์ credential
- ไม่ปิด dev server ที่เหลือค้าง แต่ให้ kill เจาะ PID (`pgrep -f 'next dev -p 3001'` ไม่ใช้ `pkill -f` ที่ชน command ตัวเอง)

## Agent Guidelines

1. ตรวจหา superadmin + ไฟล์ credential ก่อนเสมอ อย่ารีบ reset
2. reset เท่านั้นที่ได้อนุมัติ explicit จาก owner ในจุดที่ต้องแก้ prod DB
3. อย่า cat credential file แม้อยู่บนเครื่อง — บอก path + length