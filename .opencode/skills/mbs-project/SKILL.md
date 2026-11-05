---
name: mbs-project
description: สำหรับโปรเจกต์ Micro-Business-Suite (MBS) — ใช้เมื่อต้องทำงานหรือถามเรื่องสถาปัตยกรรม, Neon/PostgreSQL, multi-tenant, license gating, integration tests, Docker Compose หรือ environment. โหลด references ตามงาน; ตรวจ Neon branch ก่อนการเขียนข้อมูล. อย่าใช้กับ MBSuite.Dev ซึ่งเป็นเว็บแยก; เรื่อง superadmin credential ให้ใช้ mbs-admin-access.
version: 0.1.0
license: MIT
compatibility: opencode
category: Development Workflow
metadata:
  audience: developers
  keywords: MBS, micro-business, subscription, trial, license, gating, integration, tenant, company
  workflow: local
---

# mbs-project

Project context ของ Micro-Business-Suite (MBS)—ชุดระบบบัญชี/ขาย/รับเงินบน Next.js App Router
ใช้เมื่อต้องการรู้ว่า "ระบบนี้ทำงานยังไง" โดยไม่ต้องเริ่มค้นใหม่ทุกครั้ง

## When to use this skill

- เริ่มงานใหม่/แก้บั๊ก/เพิ่มฟีเจอร์ในโปรเจกต์นี้ ที่ต้องเข้าใจ architecture
- ถามเรื่อง schema ตาราง, ความสัมพันธ์ company_id / multi-tenant
- เรื่อง subscription, trial 30 วัน, license key (MBS.<payload>.<hmac>), gating
- เรื่อง test harness integration security (MBS_TEST_*) และข้อควรระวังฐานข้อมูลทดสอบ
- เรื่อง dev environment, port, env, script bootstrap

## When NOT to use it

- โปรเจกต์อื่นนอก Micro-Business-Suite
- เรื่อง superadmin credential/admin reset → [../../mbs-admin-access/SKILL.md](../../mbs-admin-access/SKILL.md)
- หลักการทั่วไปของ Next.js/Auth.js → skill ทั่วไป (nextjs, authjs-skills)

## ภาพรวมระบบ (ตรวจสอบแล้วในงาน P1/P2)

- **Tech stack:** Next.js App Router + TypeScript, `pg` Pool (`lib/db.ts`) ต่อ PostgreSQL/Neon ผ่าน `POSTGRES_URL` หรือ `DATABASE_URL`; Auth.js (next-auth), bcryptjs
- **Database safety:** `.env.local` is not inherently a test database. Verify its Neon branch before local commands that write data. Compose runs only the app and requires a Neon URL.
- **Auth/perm:** `lib/auth.ts` (session + `getUserCompanyId`), `lib/permissions.ts`; `users.role = 'superadmin'` is the authoritative superadmin check, not legacy group membership.
- **Menu/feature registry:** `lib/module-registry.ts` (id/label/icon/category/route/requiresAdmin/superadminOnly/enabledByDefault)
  → `components/Sidebar.tsx` + `LayoutWrapper.tsx`; admin console `/admin/customers` เป็น superadminOnly
- **Multi-tenant:** tenant scoping is implemented across company settings, journals, quotations, expenses, contacts, products, services, vouchers, invoices and payments. Read the current migration and action before relying on any particular table's live schema; production migration status is not inferred from code.
- **stale license → ล็อก "Expired"** ไม่ fallback trial; trial 30 วัน/1 user; register สร้าง company trial
- **Test status (2026-11-06):** `pnpm build` passes; `pnpm test` reports 8 pass and 9 integration tests skipped unless a disposable test environment is configured.

## References (โหลดตามงาน)

| หัวข้อ | เมื่อไหร่ | ที่ไหน |
|---|---|---|
| DB schema ตารางหลัก | ออก query/แก้ migrations/สงสัย column | [references/db-schema.md](references/db-schema.md) |
| Subscription/trial/license gating | งาน P2, license, quota, block | [references/subscription-gating.md](references/subscription-gating.md) |
| Integration security harness | รัน/แก้ integration tests | [references/integration-harness.md](references/integration-harness.md) |
| Dev environment & script | เปิด dev, seed, probe DB | [references/dev-environment.md](references/dev-environment.md) |
| Superadmin credential | ขอ user/pass admin, reset | [../../mbs-admin-access/SKILL.md](../../mbs-admin-access/SKILL.md) |

## Agent Guidelines

1. กฎ #1: ห้ามเดา — ตรวจ DB/code จริงก่อนตอบ (probe ผ่าน `lib/db.ts` + dotenv `.env.local`)
2. กฎ #2: ห้ามพิมพ์ token/key/password เต็มลง chat หรือ command
3. Before any DB write, seed, bootstrap, or migration, verify the selected Neon branch and obtain approval before production changes.
4. เปลี่ยน schema/โครงสร้างภาษาไทยของ comment ตามแบบเดิมใน repo เสมอ
5. งานสำคัญผ่าน workflow: ฌอน implement → ธาร review/approve → พี่ทดลองก่อน deploy
6. ห้าม commit/push เว้นแต่ผู้ใช้สั่งชัดเจน
7. `MBSuite.Dev` is a separate sibling repository at `../MBSuite.Dev`; never copy it into or build it from this repo.
8. Use a disposable Neon branch and a direct (non-pooled) URL for migration tests; app traffic should use a pooled URL.

## Contributing

ข้อมูลอัปเดตจากงานจริงที่ทำเสร็จใน repo นี้ (เป็น single source ของ session context แทนการเริ่มใหม่)