# Subscription / Trial / License Gating

> ระบบ "1 ลูกค้า 1 บริษัท": trial 30 วัน 1 user → ต้อง license จริง (paid) ถึงใช้ได้เต็ม
> โค้ดหลัก: `lib/company-gate.ts`, `lib/license.ts`, `lib/license-packages.ts`, `app/register/*`
> สถานะ schema ต้องตรวจจาก migration และ Neon branch เป้าหมาย; ห้ามอนุมานว่าไฟล์ migration แปลว่ารัน production แล้ว

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
- `countCompanyTransactions(companyId)` reads invoices, payments, quotations, expenses, and payment vouchers filtered by company and period. Confirm live schema migrations before rollout.
- Company-scoped create/update/delete actions must keep their `company_id` predicates; check current action code when changing quota-sensitive flows.
- `maxTransactionsPerMonth` / `max_users` มาจาก license หรือ trial default

## Security fixes สำคัญ (ธาร review F1–F6 → fix แล้ว เข้า approve)
- Server actions ต้อง auth + tenant check; quotation, invoice, expense, journal, payment, voucher, and company settings paths have tenant-scoped code/migrations. Verify both the current action and target database schema before claiming the deployed tenant boundary is active.
- `register` wrap ใน transaction (client BEGIN/COMMIT/ROLLBACK) — ลด orphan company
- `updateVouchers` Pattern? (ดู `app/actions/vouchers.ts` ตามงาน)
- TrialBanner (`components/TrialBanner.tsx`) มี branch expired

## Admin console (superadmin only — ทุก route มี `isSuperAdmin` guard → 403)
- UI: `/admin/customers`
- API: `/api/admin/customers` (GET list/POST+suspend), `/api/admin/customers/[id]` (GET/PUT/DELETE), `/api/admin/customers/[id]/license` (POST issue)
- register unlock: แรกเริ่มเพดาน superadmin ปลดล็อกผ่าน `app/register/db-init.ts` (อัปเกรด role → superadmin ในบาง flow)

## Deployment safety

- `isSuperAdmin` uses `users.role`; legacy membership in group 1 must not grant superadmin.
- Test migrations on a disposable Neon branch using a direct (non-pooled) URL. Production application requires explicit approval and backup planning.
- The integration harness resets tables in `mbs-integration-pg`; never use it against Neon or a database containing data to retain.