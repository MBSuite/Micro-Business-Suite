# Integration Security Harness (MBS_TEST_*) — 6/6 GREEN

> ยืนยันผลจริงจาก worktree: `tests 6 / pass 6 / fail 0 / skipped 0` (approved by ธาร 2026-09-24)
> เป็น test แยก DB เต็มตัว เชื่อม/เขียนข้อมูลเฉพาะ container ท้องถิ่น ไม่แตะ prod

## ไฟล์
| ไฟล์ | บทบาท |
|---|---|
| `tests/integration/run.mjs` | orchestrator ทั้งหมด (รันด้วย `pnpm test:integration` / `node tests/integration/run.mjs`) |
| `tests/integration/schema.sql` | schema ย่อ (companies/users/company_settings/contacts/invoices/invoice_items/payments) + seed |
| `tests/integration-security.test.mjs` | 6 security integration tests |

## Flow ของ run.mjs
1. `ensureContainer` — docker container `mbs-integration-pg` (postgres:16-alpine, 127.0.0.1:54329,
   user `postgres`/pass `mbs-test-only-local`, db `mbs_test`); รัน/start ถ้ายังไม่มี
2. `waitForDb` — poll จน query ได้ (รอรันครั้งแรกช้าเพราะ pull image)
3. `applySchema` — **DROP ตาราง 7 ตัว CASCADE ก่อน** แล้ว apply schema.sql (รีเซ็ตทุก run)
4. spawn `node node_modules/next/dist/bin/next dev -p 3199` + env ตรม. harness
5. `waitForApp` — poll `GET /api/db_schema` redirect manual **จนได้ 401**
6. `runTests` — `node --test tests/integration-security.test.mjs`
7. finally: kill app + `restoreEnv` (.env.local คืนที่เดิม) — ยังมี `process.on("exit")` สำรอง

## Env ที่ test อ่าน
- `MBS_TEST_BASE_URL` = http://127.0.0.1:3199
- `MBS_TEST_DATABASE_URL` = TEST_DB_URL
- `MBS_TEST_JWT_SECRET` = สุ่มใหม่ทุก run (ต้องตรงกับที่ Next ใช้ = NEXTAUTH_SECRET/AUTH_SECRET)
- **`DATABASE_URL` ต้อง set และ != MBS_TEST_DATABASE_URL** (test assert) → ใช้ placeholder `postgres://placeholder.invalid/mbs-prod-never-used`; ลบ POSTGRES_URL ออกจาก env

## Gotchas (เคยพลาดจริง → แก้แล้ว)
1. **`.env.local` ครอบ env จาก shell:** Next dev โหลด `.env.local` ทับตัวแปรที่ตั้งด้วย env ทุกครั้ง
   → ห้ามลืม: run.mjs สลับ `.env.local` → `.env.local.integration-backup` ตอนเริ่ม แล้วคืนใน finally
   (มิฉะนั้น server ต่อ prod DB และ test ที่มีการ INSERT จะแตะข้อมูลจริง!) — ตรวจสอบได้จาก `.env.local` กลับมาเดิม
2. **`sslmode`:** `lib/db.ts` อ่าน default `require` → local postgres ไม่รองรับ SSL → 500 ทุก query
   → TEST_DB_URL ต่อท้าย **`?sslmode=disable`**
3. **kill cascade:** ต้อง spawn `node node_modules/next/dist/bin/next` ตรงๆ
   (ถ้า `pnpm exec next` → กด kill ที่ pnpm ใบ้ leaf กลายเป็น orphan → bash tool รอจน timeout 600s)
   → spawn ตรง + SIGTERM → 800ms → SIGKILL
4. First-run DB init ช้ากว่า wait 40s → `waitForDb` ลูป 40×1s (รอบที่ 2 เป็นต้นไป fast)
5. Edge Runtime warnings เรื่อง `lib/googleScriptRunner.ts` (`node:child_process`/`node:path`) ผ่าน
   Edge Instrumentation (`instrumentation.ts` → `jobs/scheduleMaintenance.ts`) เป็น **noise baseline** ไม่ fail harness

## 6 tests ที่เขียว
1. DB isolation (TEST_DATABASE_URL แยกจาก prod URL)
2. protected routes → 401 (ไม่ออกมาจาก authentication)
3. regular user → 403 (ต้องเป็น superadmin)
4. superadmin backup → 200 (route `/api/admin/backup`)
5. diagnostics — superadmin เข้า `/api/db_schema`; production-only routes ยัง block
6. cross-company payment access → 403/404 (ไม่ leaked ข้ามบริษัท)

## วิธียืนยันผลสั้นๆ (ไม่ต้องอ่าน log ใหญ่)
```bash
node tests/integration/run.mjs 2>&1 | grep -E "^(✔|✖)|ℹ (tests|pass|fail|skipped)|exit code"
```

## หมายเหตุ route ที่ถูก test ตรวจ (ตัวจริงในโค้ดปัจจุบัน)
- `/api/migrate`, `/api/debug/auth`, `/system-audit`, `/api/db_schema` — **มีอยู่จริง** (production-only, guard auth/superadmin)
  → ถ้า test เดิมคาด 404 ต้องปรับ expectation ให้ตรง guard จริง (ทำเสร็จแล้วรอบ 6/6)