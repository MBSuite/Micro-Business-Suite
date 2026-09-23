-- ============================================================
-- Migration: add payment_no to payments (schema drift fix)
-- WS-3 / เฟส 3 — code/API ใช้ p.payment_no ตั้งแต่เริ่ม แต่
-- backups/snapshots เก่า (backup.sql) มี column "payment_number"
-- กลับกัน → เปิดปัญหาใน test bootstrap (harness cross-company
-- INSERT payment_no ล้ม with column does not exist)
--
-- idempotent; ปลอดภัยสำหรับ env ที่มี payment_no อยู่แล้ว
-- ============================================================

BEGIN;

ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_no VARCHAR(50);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_payment_no_key') THEN
    ALTER TABLE payments ADD CONSTRAINT payments_payment_no_key UNIQUE (payment_no);
  END IF;
END $$;

COMMIT;