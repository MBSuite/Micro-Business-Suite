-- ============================================================
-- Migration: add status to payments (schema drift fix #2)
-- Code/master ใช้ p.status (default 'completed') แต่ snapshot
-- เก่า (backup.sql) ไม่มี column นี้ → harness fixture เปิด
-- column "status" does not exist
-- idempotent; ปลอดภัยกับ env ที่มีอยู่แล้ว
-- ============================================================

BEGIN;

ALTER TABLE payments ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'completed';

COMMIT;