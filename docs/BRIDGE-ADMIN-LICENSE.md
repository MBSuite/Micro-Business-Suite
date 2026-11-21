# Bridge: Admin License (Core ← micro-admin) — 2026-11-21

## 1. วัตถุประสงค์
ให้ micro-admin สั่งออก/ต่ออายุ/ระงับ/ตรวจ license ได้ **โดยไม่ copy license logic และไม่ cross-database** ตาม `LICENSE_STANDARD.md` N1/N7

- logic ทั้งหมดอยู่ที่ Core (`lib/license.ts`, `lib/license-packages.ts`)
- micro-admin ส่งเฉพาะ payload ที่ validate แล้ว → Core เป็นคนเซ็น key + เขียน `companies` / `subscription_events`
- endpoint ใหม่: `POST /api/bridge/admin-license` (ไฟล์ `app/api/bridge/admin-license/route.ts`)

## 2. Authentication (fail closed)
- ใช้ `MBS_ADMIN_LICENSE_TOKEN` (token **ใหม่เฉพาะงานนี้**) ผ่าน `Authorization: Bearer <token>`
- ตรวจด้วย `hasBridgeServiceToken()` (constant-time compare)
- **ห้ามใช้ `MBS_BRIDGE_TOKEN` ซ้ำ** (token นั้นเป็นของ Core ↔ 6 modules)
- ถ้าไม่ได้ตั้ง token → ตอบ **503** ทันที; token ผิด → **401**
- ตั้งค่าใน `.env.example` ของทั้ง Core และ micro-admin (ชื่อตัวแปรอย่างเดียว ห้าม commit ค่าจริง)

## 3. Actions

| action | ผล | เขียน DB |
|---|---|---|
| `ISSUE` | สร้าง license key ใหม่ + อัปเดต `companies` + `INSERT subscription_events` | ✅ |
| `RENEW` | เหมือน ISSUE แต่ action ในประวัติเป็น `RENEW` | ✅ |
| `REVOKE` | ล้าง `license_key`, ตั้ง `subscription_status='Revoked'`, `expiry_date=CURRENT_DATE` + บันทึก event | ✅ |
| `VERIFY` | เรียก `verifyLicenseKey(key, getSigningSalt())` คืน `valid/payload/error` | ❌ อ่านอย่างเดียว |

### หมายเหตุ REVOKE
`LICENSE_STANDARD.md` เดิมไม่มี semantics ของ revoke — การตัดสินใจที่นี่:
- offline key ที่เซ็นแล้ว **เพิกถอนจากระยะไกลไม่ได้** → ต้องลบ key ออกจาก `companies` และตั้งสถานะ `Revoked` แล้วให้การตรวจแบบ online เป็นความจริง
- key เก่ายังถูกเก็บไว้ใน `subscription_events.license_key` เพื่อ audit

### `dry_run`
- `dry_run: true` → ตรวจทุกอย่าง + สร้าง key จริง แต่ **ข้าม UPDATE/INSERT ทั้งคู่** (ใช้ทดสอบ integration โดยไม่แตะข้อมูล)
- ยังต้องมี token เหมือนเดิม → ไม่ใช่ช่องโหว่ (token holder สามารถเรียก action จริงได้อยู่แล้ว)

## 4. ตัวอย่างเรียก (dry run — ปลอดภัย ไม่เขียน DB)
```bash
curl -sS -X POST http://localhost:3001/api/bridge/admin-license \
  -H "Authorization: Bearer $MBS_ADMIN_LICENSE_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"action":"ISSUE","companyId":1,"mode":"subscription","license_type":"PROFESSIONAL","expires":"2027-12-31","dry_run":true}'
```

## 5. สิทธิ์ (บังคับที่ micro-admin ก่อนส่ง bridge)
Core ไม่รู้ role ของ micro-admin → micro-admin เป็นคนบังคับอีกชั้น:
- `ISSUE` ต้องมี `licenses.issue`
- tier `AUDIT` ต้องมี `licenses.issue_audit` (superadmin only)
- `RENEW` ต้องมี `licenses.renew`
- `REVOKE` ต้องมี `licenses.revoke`
- `VERIFY` ต้องมี `licenses.verify`

`created_by` ที่ส่งมาคือ user id จากตาราง `users` เดียวกัน (FK ของ `subscription_events` ยังใช้ได้)

## 6. สถานะการทดสอบ
- `npx tsc --noEmit` ✅ · `npx eslint app/api/bridge/admin-license/route.ts` ✅
- `npm test` ✅ (รวม `tests/admin-license-bridge.test.mjs` 5 tests)
- integration dry-run กับ Neon: ดูบันทึกใน micro-admin `docs/IMPACT-license-write-core-bridge.md`
- **✅ E2E เขียนจริงผ่านแล้ว (2026-11-21, ได้รับอนุมัติจากพี่ฆัง):** เรียกจาก micro-admin API (session จริง) → bridge → Neon
  - `ISSUE` (company 12, perpetual, PROFESSIONAL) → 200 `dry_run:false`, key 512 ตัว, `UPDATE companies` + `INSERT subscription_events(action='ISSUE')` สำเร็จ
  - `VERIFY` key ที่เขียนลง DB → `valid:true`, payload ตรงกับที่ออก
  - `REVOKE` → 200 `dry_run:false`, `license_key=NULL`, `subscription_status='Revoked'`, `expiry_date=CURRENT_DATE`, event `REVOKE` เพิ่ม (รวม 2 event)
  - `RENEW` ใช้บล็อก `if (!dryRun)` ตัวเดียวกับ ISSUE (ต่างแค่ค่าที่ใส่ `action`) → ครอบคลุมโดยการทดสอบ ISSUE, แต่ไม่ได้รันแยก
  - สำรอง state เดิมไว้ที่ `/tmp/opencode/license-e2e-backup-company12.json` (company 12 ตอนนี้เหลือสถานะ `Revoked`)
