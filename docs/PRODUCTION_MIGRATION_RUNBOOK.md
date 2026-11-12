# Production Migration Runbook (Core)

ใช้สำหรับ apply migration บน Production (Supabase) เท่านั้นหลัง owner อนุมัติ

## Pre-flight
- [ ] Gate 1 (Dev signup/delete) ผ่านและบันทึกหลักฐาน
- [ ] Gate 2 (Dev 2FA) ผ่านและบันทึกหลักฐาน
- [ ] `npm run audit:company-mappings` บน Production แล้วไม่มี unmapped/invalid หรือมี owner-approved mapping ครบ
- [ ] backup Production database แล้ว
- [ ] ตรวจ `DATABASE_URL`/`POSTGRES_URL` ชี้ Production จริง
- [ ] ตรวจ migration files บน branch ที่จะ deploy

## Migrations ที่ต้อง apply
- `migrations/add_integration_webhook_idempotency.sql`
- `migrations/add_user_two_factor.sql`
- `migrations/add_users_company_id_backfill.sql` (no-op review version)

## Apply
1. เปิด maintenance window
2. รัน migration ทีละไฟล์บน Production ด้วย client ที่ใช้ direct URL
3. ตรวจผล:

```sql
SELECT to_regclass('public.integration_webhook_events');
SELECT to_regclass('public.user_recovery_codes');
SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name IN ('totp_secret','totp_enabled','totp_verified_at');
```

4. ถ้า migration fail ให้หยุดและ rollback app deploy ทันที

## Deploy
1. deploy app บน Vercel
2. รอ build สำเร็จ
3. smoke test:
   - `/login`
   - `/settings` เปิด/ปิด 2FA
   - `/api/integrations/webhook` idempotency
   - unmapped user ได้ 403

## Rollback
- App rollback ก่อน schema rollback
- Schema rollback ต้องมี inverse script ที่ owner อนุมัติ
- ห้าม drop table ที่มีข้อมูล production โดยไม่ backup และไม่ได้รับอนุมัติ

## Evidence
- migration log
- verification query result
- smoke test result
- deploy URL/commit
