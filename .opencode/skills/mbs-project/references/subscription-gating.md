# Subscription / Trial / License Gating (P2)

> ระบบ "1 ลูกค้า 1 บริษัท": trial 14 วัน 1 user → ต้อง license จริง (paid) ถึงใช้ได้เต็ม
> โค้ดหลัก: `lib/company-gate.ts`, `lib/license.ts`, `lib/license-packages.ts`, `app/register/*`

## รูปแบบ license key
```
MBS.<base64url(payload)>.<base64url(hmac)>   // hmac = HMAC-SHA256(payload, LICENSE_SALT)
```
- **payload ต้องมีครบ (strict — ได้จากการ review):** `mode`, `license_type`, `licensee`, `company`,
  `issued_at`, `max_users`, `max_transactions_per_month`, `allowed_features`
  (มีเพียง `expires_at` ที่ optional)
- `validateLicensePayload(payload)` ตรวจทุก field บังคับ → payload ไม่ครบ = invalid
- `MBS_LICENSE_KEY` (ระดับ product) ก็ผ่าน `verifyLicenseKey` เส้นทางเดียวกัน → startup
  `requireActiveLicense` จะ fail ถ้า key ไม่ครบตาม interface (เคยเตือนพี่แล้ว)

## Gating state (จาก `canAccessFeature` + `/api/me/gate` ต่อ client)
| สถานะบริษัท | isPaid | trial | allowedFeatures | maxTransactionsPerMonth |
|---|---|---|---|---|
| Active + license ใช้ได้ | true | false | เต็ม | ตาม license |
| Trial (ยังไม่หมด) | false | true | seeded | ตาม trial (ค่าเริ่ม) |
| Trial หมด / ไม่มี license | false | false | [] | 0 |
| **invalid/expired license** | **false** | **false** | **[]** | **0** (ล็อก "Expired" ไม่ fallback trial) |

- license ไม่ผ่าน verify → company ถูกมองเป็น **Expired** (ไม่กลับไป trial)
- `trial_end = NULL` → โดน block ยกเว้น **default company** (บริษัทแรกสุด, `isDefaultCompany` helper)
- `BLOCKED_SUBSCRIPTION_STATUSES` (Suspended/Expired/Blocked) ใช้ใน `assertCompanyQuota` → block ผ่านกึ่ง gate

## Quota
- `countCompanyTransactions(companyId)` = **นับ `invoices` + `payments` เท่านั้น** (ไม่นับ expenses เพราะยังไม่มี company_id → ถ้านับจะ 500)
- `createInvoice` / `createPayment` **ตั้ง `company_id` แล้ว** → ปิดช่องหลบ quota (เคยเป็น hole)
- `maxTransactionsPerMonth` / `max_users` มาจาก license หรือ trial default

## Security fixes สำคัญ (ธาร review F1–F6 → fix แล้ว เข้า approve)
- Server actions ต้อง auth + tenant check:
  - `updateInvoice` / `deleteInvoice` / `markInvoiceAsPaid` → session + company ตรวจ
  - `updateQuotation` / `deleteQuotation` / `updateQuotationStatus` → auth-check เท่านั้น (quotations ยังไม่มี company_id → tenant เต็มรอ WS-3)
- `register` wrap ใน transaction (client BEGIN/COMMIT/ROLLBACK) — ลด orphan company
- `updateVouchers` Pattern? (ดู `app/actions/vouchers.ts` ตามงาน)
- TrialBanner (`components/TrialBanner.tsx`) มี branch expired

## Admin console (superadmin only — ทุก route มี `isSuperAdmin` guard → 403)
- UI: `/admin/customers`
- API: `/api/admin/customers` (GET list/POST+suspend), `/api/admin/customers/[id]` (GET/PUT/DELETE), `/api/admin/customers/[id]/license` (POST issue)
- register unlock: แรกเริ่มเพดาน superadmin ปลดล็อกผ่าน `app/register/db-init.ts` (อัปเกรด role → superadmin ในบาง flow)

## RED ที่ค้าง (ตกลงไว้ หลัง deploy)
1. WS-3 #4: เติม `company_id` ให้ quotations/expenses/contacts/products/services/journals + UNIQUE `users.email`
2. (ไม่มี blocking ด้าน subscription เหลือ)