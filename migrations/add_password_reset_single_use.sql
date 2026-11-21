-- ============================================================
-- Migration: Password reset token แบบใช้ครั้งเดียว + revocation ของ session
-- Description: เก็บ jti ของ reset token เพื่อป้องกัน replay ภายในอายุ token
--              และเพิ่ม users.password_changed_at เพื่อให้ session เก่าใช้ไม่ได้หลังเปลี่ยนรหัสผ่าน
-- ความเสี่ยง: DDL แบบ additive เท่านั้น แต่ยังต้องทดสอบบน disposable branch
--              และได้รับอนุมัติจาก owner ก่อนใช้กับ Production
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    jti UUID PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id);

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE;

COMMIT;
