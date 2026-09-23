# API Access Matrix (WS-3 #3) — v1 — 404/403 policy

> สถานะ: **v1 — aligned กับ `tests/integration-security.test.mjs` และ route ปัจจุบัน**
> ตารางนี้คือหน่วยเดียวของ truth สำหรับ WS-3 #3 และการแก้ route ต่อไป

Legend: `401` = ต้อง login · `403` = login แต่สิทธิ์ไม่ถึง · `ok` = สำเร็จ

| Route | Method | ไม่มี token | user | admin | superadmin | หมายเหตุ |
|---|---|---|---|---|---|---|
| `/api/payments` | GET | 401 | ok | ok | ok | WS-1 ใส่ auth แล้ว · company scope รอ WS-3 #5 |
| `/api/payments/[id]` | GET/PUT/DELETE | 401 | ok (scoped) | ok (scoped) | ok | ข้ามบริษัท → GET `404`, PUT/DELETE `403` หลัง migration company_id |
| `/api/settings` | GET | 401 | ok | ok | ok | |
| `/api/settings` | PUT | 401 | 403 | ok | ok | ปรับแต่งบริษัท = admin เท่านั้น |
| `/api/import` | POST | 401 | ok | ok | ok | implementation ปัจจุบันอนุญาต user ทุก role |
| `/api/admin/backup` | GET | 401 | 403 | ok | ok | WS-1: `canAccessAdmin()` |
| `/api/reset_billing` | POST | 401 | 403 | ok+token | ok+token | WS-1 + confirm token |
| `/api/admin/google-sync` | POST | 401 | 403 | ok | ok | WS-1: `canAccessAdmin()` |
| `/api/migrate` | POST | **404** | 404 | 404 | 404 | env-gated: เปิดเมื่อ `MIGRATE_ENDPOINT_ENABLED=true` (default ปิด) |
| `/api/db_schema` | GET | 401 | 403 | ok | ok | WS-1 ใส่ auth+admin (ไม่ใช่ 404 — เห็น schema ต้อง admin) |
| `/system-audit` | GET | **404** | 404 | 404 | 404 | env-gated: เปิดเมื่อ `SYSTEM_AUDIT_ENABLED=true` (default ปิด); เมื่อเปิดยังไม่มี auth guard |
| `/api/debug/auth` | GET/POST | **404** | 404 | 404 | 404 | disable ทั้งวิธี (WS-1) |

## กติกาที่ตกลงร่วมกัน
1. **env-gated routes** (`migrate`, `system-audit`) คืน `404` เสมอเมื่อ env ไม่เปิด — ไม่ดัก auth (ไม่มีประโยชน์เปิดหลังประตูปิด)
2. **diag/routes ข้อมูลภายใน** (`db_schema`) คืน `401/403` แต่ไม่อนุญาต open → ต่างจาก 404 เพราะคือ "อยู่แล้วแต่เราห้ามคุณ"
3. **cross-company** ที่ธาร test (harness `cross-company payment access is denied`) → GET ใช้ `404` เพื่อไม่เปิดเผยการมีอยู่ของ row; PUT/DELETE ใช้ `403` เพื่อความชัดเจนของ log audit

## การเปิดให้ใช้งาน (เมื่อต้องการ)
- `migrate` → เปิด `MIGRATE_ENDPOINT_ENABLED=true` เฉพาะ env ที่จะรัน (เช่น staging)
- `system-audit` → เปิด `SYSTEM_AUDIT_ENABLED=true` เฉพาะ dev และต้องเพิ่ม auth guard ก่อนเปิดใช้งานจริง

— aligned โดยธาร; open issue ที่เหลือคือ auth guard ของ `/system-audit` เมื่อเปิด env และการแยก test DB สำหรับ integration harness