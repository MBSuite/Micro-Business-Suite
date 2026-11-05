# Architecture Overview

## Stack

- App: Next.js (App Router) + TypeScript
- Database: PostgreSQL (Neon)
- Auth: NextAuth credentials

## Core Modules

- Sales: quotations, invoices, payments
- Purchase: expenses, vouchers
- Accounting: journal entries + chart of accounts
- Access control: RBAC groups/permissions
- Settings/integrations: company settings + Google integration

## Plugin / Add-on Architecture (MBSuite Core)

- MBSuite = Core: โมดูลหลัก (บัญชี/ภาษี/ผู้ติดต่อ/COA/สมาชิก/กลุ่ม/โมดูลควบคุม) มี `core: true` ใน `lib/module-registry.ts` → ปิดไม่ได้
- Plugin modules: `core: false` → ติดตั้ง/เปิด-ปิดต่อ company ผ่าน `/admin/modules` หรือ `/admin/plugins`
- Plugin packs: `lib/plugin-packs.ts` กลุ่ม module เป็น pack (retail_pos, f_and_b, pharmacy, service_business, ...)
- ฐานข้อมูล tenant-scoped (`company_id`) บนทุกตารางใหม่ (branches, product_variants, loyalty_*, promotions, branch_stock, fb_*, integration_connections)
- Migration files: `migrations/add_*.sql` (idempotent, guarded FK, indexes)

## Plugin Modules (installable)

- pos_checkout, promotions, sales_analytics, crm_loyalty, employee_sales
- f_and_b, ecommerce_integration, delivery_integration
- multi_branch, inventory_variants, offline_mode

## Canonical Data Flow

1. Business document created (`invoice`, `expense`, `payment_voucher`, `payment`)
2. Accounting entry generated in `journal_entries`
3. Reports/dashboard read normalized journal presentation
4. Access enforced by RBAC (`groups`, `group_permissions`, `user_groups`)

## Canonical Access Standard

- Role baseline: `superadmin`, `admin`, `user`
- Permission model: module/action via RBAC
- Helper standard: `lib/core-standards.ts`

## FX Rate Source (`/api/fx-rate`)

- Endpoint: `GET /api/fx-rate` → latest USD/THB + 30d series + trend (low/high/%change)
- Source: Bank of Thailand reference rate via `https://api.frankfurter.dev/v2` (`providers=BOT`)
- Server-side cache: latest 6h, series 24h (in-memory Map)
- Used by invoice creation "FX Mode": prefill `fxRate` and monitor currency movement before billing (billing policy is configured per installation via company settings)

## Stability Rules

- Preserve historical accounting evidence
- Backward compatibility required
- No destructive schema operations in production

