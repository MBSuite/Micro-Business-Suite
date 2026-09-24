---
name: mbs-project
description: สำหรับโปรเจกต์ Micro-Business-Suite (MBS) — project context แบบครบวงจร ใช้เมื่อต้องทำงาน/แก้ไข/ถามเรื่องระบบนี้ แล้วต้องการเข้าใจสถาปัตยกรรมก่อนลงมือ (แทนการเริ่มค้นใหม่): tech stack, การ auth/admin group, schema ตารางหลัก, ระบบ subscription/trial/license gating, integration security harness ที่ทดสอบแล้ว, และ env การพัฒนา. โหลด references ตามงานที่เจอ. อย่าใช้กับโปรเจกต์อื่น; เรื่อง superadmin credential ให้ใช้ skill mbs-admin-access แทน.
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
- เรื่อง subscription, trial 14 วัน, license key (MBS.<payload>.<hmac>), gating
- เรื่อง test harness integration security (MBS_TEST_*) ที่ 6/6 เขียวแล้ว
- เรื่อง dev environment, port, env, script bootstrap

## When NOT to use it

- โปรเจกต์อื่นนอก Micro-Business-Suite
- เรื่อง superadmin credential/admin reset → [../../mbs-admin-access/SKILL.md](../../mbs-admin-access/SKILL.md)
- หลักการทั่วไปของ Next.js/Auth.js → skill ทั่วไป (nextjs, authjs-skills)

## ภาพรวมระบบ (ตรวจสอบแล้วในงาน P1/P2)

- **Tech stack:** Next.js App Router + TypeScript, `pg` Pool เชื่อม PostgreSQL (Neon prod),
  Auth.js (next-auth) พร้อม `NEXTAUTH_SECRET`/`AUTH_SECRET`, bcryptjs hash password,
  โหลด env จาก `.env.local` (ต่อ **prod DB จริง** แม้รัน local)
- **Auth/perm:** `lib/auth.ts` (session + `getUserCompanyId`), `lib/permissions.ts`
  (group-based; group id **1 = superadmin**, 2 = admin), `lib/core-standards.ts`
  (CORE_ROLES = superadmin/admin/user)
- **Menu/feature registry:** `lib/module-registry.ts` (id/label/icon/category/route/requiresAdmin/superadminOnly/enabledByDefault)
  → `components/Sidebar.tsx` + `LayoutWrapper.tsx`; admin console `/admin/customers` เป็น superadminOnly
- **Multi-tenant:** คอลัมน์ `company_id` บนเอกสาร (invoices/payments **ตั้งตอนสร้างแล้ว**);
  **RED/ยังไม่ครบ:** quotations/expenses/contacts/products/services/journals ยังไม่มี/ไม่ครบ `company_id`
  (งาน WS-3 #4) และ `users.email` **ยังไม่มี UNIQUE constraint**
- **stale license → ล็อก "Expired"** ไม่ fallback trial; trial 14 วัน/1 user; register สร้าง company trial
- **Test coverage:** 8 หน่วย + 6 integration (harness แยก DB, เขียวหมด)

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
3. `.env.local` ต่อ **prod DB ตัวจริง** — ทุก script ที่รัน local ทำงานกับข้อมูลจริง ระวังทุกแก้
4. เปลี่ยน schema/โครงสร้างภาษาไทยของ comment ตามแบบเดิมใน repo เสมอ
5. งานสำคัญผ่าน workflow: ฌอน implement → ธาร review/approve → พี่ทดลองก่อน deploy
6. ห้าม commit/push เว้นแต่ผู้ใช้สั่งชัดเจน

## Contributing

ข้อมูลอัปเดตจากงานจริงที่ทำเสร็จใน repo นี้ (เป็น single source ของ session context แทนการเริ่มใหม่)