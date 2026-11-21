# MBS License Standard v1 — แหล่งความจริงเดียวสำหรับ 7 โมดูล

| รายการ | ค่า |
| --- | --- |
| Status | **Authoritative** — ทุก module ต้องปฏิบัติตาม ห้ามตีความใหม่ |
| Owner | พี่ฆัง (owner) · ดูแลโดย OpenCode |
| ที่อยู่ | ไฟล์นี้ = `/home/neon13/workspace/services/next/00-MAIN-WEB/Micro-Business-Suite/docs/LICENSE_STANDARD.md` |
| ใช้กับ | `Micro-Business-Suite` (Core) + 7 modules: `Service`, `Retail`, `Rental`, `Pharmacy`, `Hotel`, `FNB`, `Contracts` |
| อ้างอิงรายละเอียด | `../Micro-Admin-MBSuite/micro-admin-mbsuite/docs/PRD-user-license-management.md` |
| อัปเดตล่าสุด | 2026-11-21 |

---

## 0. วิธีใช้งาน (สำหรับ AI ทุกตัวในทุก repo)

1. **อ่านไฟล์นี้ก่อนเขียนโค้ด/ออกแบบ license ในทุก module** — ใช้ absolute path ด้านบน
2. ถ้าคำสั่งใน repo ขัดกับไฟล์นี้ → **หยุดแล้วถามพี่ฆัง** ห้ามเลือกเอง
3. ห้ามอ้างความทรงจำเก่าหรือเอกสารเก่าที่ขัดกับไฟล์นี้ — ตรวจจากโค้ดจริง + ไฟล์นี้เท่านั้น
4. หลังแก้โค้ดต้องอัปเดต docs ใน repo ที่แก้ให้ตรงกัน 100% (Anti-Drift)

---

## 1. สิ่งที่ห้ามผิด (Non-negotiables)

| # | กฎ |
| --- | --- |
| N1 | **Logic ออก/verify license อยู่ที่ Core เท่านั้น** (`lib/license.ts`) — module **ห้าม copy** ไปใส่ใน repo ตัวเอง |
| N2 | ทุก module ที่สมัครตรงต้องได้ **subscription license ทันที** — ไม่มี license = ขายไม่ได้ |
| N3 | `AUDIT` เป็น license **ประเภทแยก** สำหรับ audit-test user — ห้ามใช้ `TRIAL`/`PROFESSIONAL` แทน |
| N4 | `AUDIT` ออกได้เฉพาะ **superadmin** เท่านั้น; ตั้ง `companies.is_audit = true`; บันทึก `subscription_events` |
| N5 | `mode = subscription` ต้องมี `expires_at` เสมอ; `mode = perpetual` ห้ามมี subscription key |
| N6 | ออก/ต่ออายุ license → `trial_end = NULL`, `last_renewed_at = NOW()` เสมอ |
| N7 | ใช้ Bridge API แบบ authenticated — **ห้าม cross-database**, ห้ามใช้ `MBS_COMPANY_ID` scope request |
| N8 | ถ้า Bridge ล้มเหลว **ห้ามบล็อก registration** → ทำ outbox/retry + แสดงสถานะใน UI |
| N9 | Production ต้องมี `LICENSE_SALT` / `SESSION_SECRET ≥ 32` หรือ fail fast — ห้าม fallback/hardcode |
| N10 | AI ทำได้แค่ local commit — **ห้าม push / deploy / login Vercel / แก้ prod DB** |

---

## 2. รูปแบบ Key (ห้ามเปลี่ยน)

```
MBS.<base64url(payload)>.<base64url(HMAC-SHA256(payloadB64, LICENSE_SALT))>
```

- verify แบบ offline ด้วย `LICENSE_SALT`, เปรียบเทียบด้วย `timingSafeEqual`
- `product = "micro-business-suite"` เสมอ
- Implementation เดียว: `Micro-Business-Suite/lib/license.ts` (`createLicenseKey`, `verifyLicenseKey`, `validateLicensePayload`)

### Payload (required ทั้งหมด ยกเว้น `expires_at`)

`product`, `mode`, `license_type`, `licensee`, `company`, `issued_at`, `max_users`, `max_transactions_per_month`, `allowed_features`
`expires_at` → **บังคับเมื่อ subscription**

---

## 3. Tier Matrix (ห้ามเพิ่ม/ลดเอง)

| Tier | users | tx/เดือน | หมายเหตุ |
| --- | --- | --- | --- |
| `TRIAL` | 1 | 30 | 30 วัน (`trialEndFromNow()`) **ห้ามออก key** — เป็นสถานะสมัครเอง |
| `STANDARD` | 3 | 500 | **default สำหรับสมัครตรงทุก module** |
| `PROFESSIONAL` | 5 | 2000 | |
| `ENTERPRISE` | 20 | 10000 | |
| `AUDIT` | 5 | 2000 | features = PROFESSIONAL + `audit_mode`; subscription เสมอ; `is_audit=true`; **ห้ามได้** `multi_company`/`api_access`/`custom_branding` (สงวน ENTERPRISE) |

Source ของ matrix: `Micro-Business-Suite/lib/license-packages.ts` — แก้ที่เดียว ทุก module ได้ผลเหมือนกัน

---

## 4. ที่อยู่ของข้อมูล (Core shared DB)

ตาราง `companies`: `license_key`, `plan_type`, `max_users`, `subscription_status`, `expiry_date`, `trial_end`, `last_renewed_at`, `price_amount`, `price_currency`, `notes`, **`is_audit`** (ใหม่)
ตาราง `subscription_events`: ทุกการ ISSUE/RENEW/SUSPEND/RESUME/NOTE บันทึก `license_type`, `license_key`, `expires_at`, `payload` (JSONB — ใส่ `is_audit` ในนี้)

Migration: `migrations/mbs_core_add_audit_license.sql` (ลงทะเบียนใน `scripts/bootstrap-init-db.mjs` แล้ว)

---

## 5. สิ่งที่แต่ละ module ต้องทำ (Checklist ต่อ repo)

- [ ] อ่าน `LICENSE_STANDARD.md` นี้ก่อนเริ่มงาน
- [ ] ตรวจว่า repo มีชั้น license enforcement เองไหม → ถ้ามี ให้ถอดออก ใช้ Core เป็นแหล่งเดียว (เก็บได้แค่ env `MBS_LICENSE_KEY` placeholder)
- [ ] Registration flow: สมัครตรง → เรียก Core ออก `STANDARD`/subscription ผ่าน Bridge (async/outbox, ไม่ block)
- [ ] UI แสดงสถานะ license + วันหมดอายุ + badge `AUDIT` ถ้าเป็น audit user
- [ ] `.env.example` มีแค่ placeholder — ค่าจริงอยู่ใน `.env` (gitignored)
- [ ] Migration ใหม่ของ module ใช้ prefix `mbs_<module>_<what>` และตาม `docs/MODULE_MIGRATION_RUNBOOK.md`
- [ ] อัปเดต `README.md` / `MAINTENANCE.md` / `AGENTS.md` ให้ตรงโค้ดก่อนสรุปงาน
- [ ] รัน `typecheck` / `lint` / `build` แล้วรายงาน commit hash (local only)

---

## 6. ข้อความสั่งแบบ copy-paste (ใช้กับ AI ใน 6 repo ที่เหลือ)

ดูไฟล์ `AI_BRIEF-license-standard.md` ในโฟลเดอร์เดียวกัน — คัดลอกไปวางแล้วเปลี่ยนชื่อ module เดียวเท่านั้น

---

## 7. การตรวจความสอดคล้อง (รันจริง ห้ามเดา)

```bash
# ตรวจว่าทุก repo อ้าง standard เดียวกัน
grep -rn "LICENSE_STANDARD.md" \
  /home/neon13/workspace/services/next/00-MAIN-WEB/Micro-Business-*/AGENTS.md \
  /home/neon13/workspace/services/next/00-MAIN-WEB/Micro-Business-*/README.md

# ตรวจว่าไม่มี module ไหน copy license logic ไปเอง
grep -rln "createLicenseKey\|verifyLicenseKey\|LICENSE_PACKAGES" \
  /home/neon13/workspace/services/next/00-MAIN-WEB/Micro-Business-*/lib \
  --include='*.ts' | grep -v Micro-Business-Suite
```

ผลที่คาด: บรรทัดแรกเจอ pointer ในทุก repo; บรรทัดที่สอง **ไม่มีผลลัพธ์** (ยกเว้น Core)

---

## 8. ผลตรวจ live 2026-11-21 (ข้อเท็จจริงที่ต้องยึด)

### 8.1 Production DB = **Neon** `ep-delicate-base-b31rx7ol` (ap-southeast-1)

ตรวจจาก `.env.local` (DATABASE_URL/POSTGRES_URL/UNPOOLED/NEON_DATA_API ชี้ neon.tech), `lib/db.ts`, `next.config.ts` CSP, `docs/DECISIONS.md:55-56` (Vercel prod มี Neon env vars เท่านั้น), `docs/PRODUCTION_MIGRATION_RESULTS.md`
→ ยังต้องตรวจซ้ำก่อนรัน migration ทุกครั้งตาม runbook; AI ห้าม login Vercel ให้พี่ฆังตรวจ Dashboard เอง

### 8.2 🚨 `PRODUCT_MODE` — จุดบล็อกที่ต้องตรวจก่อน implement

`.env.local` = `perpetual` แต่ `lib/license.ts::verifyLicenseKey()` ปฏิเสธ subscription key ทันทีเมื่อ `PRODUCT_MODE=perpetual`
ถ้า Vercel production เป็น `perpetual` → **subscription license ที่ออกให้ลูกค้าสมัครตรงจะ verify ไม่ผ่าน** ทำให้เป้าหมายหลักของมาตรฐานนี้ล้มเหลว
→ **MISSING:** ให้พี่ฆังตรวจค่า `PRODUCT_MODE` บน Vercel แล้วตัดสินก่อน implement (เปลี่ยนเป็น subscription หรือแก้กฎ verify) ห้าม AI เดาหรือเปลี่ยนเอง

### 8.3 `audit_mode` — feature เดียวพอ แต่ต้องเลือกให้ชัดว่าเป็น gate หรือ label

- `KNOWN_FEATURES` derive จาก `LICENSE_PACKAGES` → ได้ `audit_mode` อัตโนมัติ
- `PROTECTED_FEATURES` (`lib/license-check.ts`) เป็น map hardcode แยก → ต้องเพิ่มเองถ้าจะใช้ `withLicenseCheck("AUDIT_MODE")`
- ไม่เพิ่ม feature ชื่ออื่นที่ไม่มีโค้ดรองรับ (กัน capability ปลอม)
- รายละเอียด: `../Micro-Admin-MBSuite/micro-admin-mbsuite/docs/PRD-user-license-management.md` §15
