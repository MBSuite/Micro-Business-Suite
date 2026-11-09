# E2E SSO Checklist — Micro-Business-Suite

> **เจตนา:** เตรียมสำหรับการทดสอบ end-to-end SSO ของ module ที่ backend ผ่านแล้ว
> **Scope:** module ที่ backend เสร็จใน phase แยกทีละ round — Micro-Business-Service, Retail, Rental, Pharmacy, Hotel
> **หมายเหตุ:** Micro-Business-FNB ยังกำลังพัฒนาโดยเจ้าของ — รอรอบ FNB ก่อนเพิ่มลง checklist

---

## 1. Preconditions (สำหรับทุก module)

- [ ] Core deployed & reachable (`https://micro-business-suite.vercel.app` หรือ env ของ test env)
- [ ] Module deployed & reachable (module URL ของแต่ละตัว)
- [ ] Module env: `MBS_HUB_URL` = Core base URL (เพื่อทด SSO-enabled mode)
- [ ] Module env: `MBS_SSO_AUDIENCE` = `mbs-<module>` (service / retail / rental / pharmacy / hotel)
- [ ] Module env: `MBS_CORE_ISSUER` = Core issuer (default `https://micro-business-suite.vercel.app`)
- [ ] Test users: superadmin/admin + staff user (mapped กับ `core_user_id` ของ Core) ใน DB test
- [ ] `MBS_TEST_*` env สำหรับ integration harness (ถ้าใช้ infra)

## 2. E2E Flow (Core → Module)

1. เปิด module login page (`/<module>/login`)
2. SSO button ถูก render ตัวเลือก → เริ่ม SSO:
   - Module → redirect Core: `{CORE}/login?redirect={module}/auth/sso-callback&audience={audience}`
3. Core verify SSO token (JWKS) → ตอบ redirect ไป module callback พร้อม `sso_token`
4. Module callback (`/auth/sso-callback`): รับ `sso_token` → POST `/api/auth/sso` → verify → สร้าง session → redirect `/staff/dashboard`
5. Verify: session ของ module สร้างสำเร็จ → ไป `/staff/dashboard` ได้ → user context (company) ถูกต้อง

## 3. Standalone Mode

- [ ] Module env ไม่มี `MBS_HUB_URL` → SSO button **หาย** จาก login page
- [ ] Local login (email/password) ยังทำงานได้
- [ ] `POST /api/auth/sso` → `503 { error: "SSO not configured" }`

## 4. Negative Cases

- [ ] ไม่มี `sso_token` → error `"ไม่พบ SSO token"` + link กลับ login
- [ ] Token ไม่ valid / verify fail → `"SSO verification failed"` / `"Invalid SSO token"`
- [ ] ไม่ auth → callback/API ตอบ `401`

## 5. Per-Module Status (อัปเดตอ้างอิง)

| Module | Backend | SSO UI polish (Kiro) | Standalone fix (OpenCode) | E2E SSO |
|---|---|---|---|---|
| Micro-Business-Service | ✅ | pending | ✅ done | pending |
| Micro-Business-Retail | ✅ | pending (audit complete) | ✅ done | pending |
| Micro-Business-Rental | ✅ | pending | ✅ done | pending |
| Micro-Business-Pharmacy | ✅ | pending | ✅ done | pending |
| Micro-Business-Hotel | ✅ | pending | ✅ done | pending |
| Micro-Business-FNB | ⏸️ (user WIP) | — | — | — |

## 6. Acceptance Criteria

- [ ] Flow E2E: module login → SSO initiate → Core verify → callback → dashboard ✅
- [ ] Standalone: SSO hidden + local login OK ✅
- [ ] Negative: missing/invalid token handled ✅

---

*อัปเดต checklist เมื่อเริ่ม/ปิดแต่ละ module ในลำดับรอบ (Round) ที่เกี่ยวข้อง*
