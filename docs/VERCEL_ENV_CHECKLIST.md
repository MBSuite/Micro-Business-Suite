# Vercel Environment Variables Checklist

ตั้งค่าใน Vercel Dashboard → Project → Settings → Environment Variables
เลือก Environment: **Production + Preview** (ถ้าใช้ preview deployments)

## MBS Core (Micro-Business-Suite)

### Required (Core)
- [ ] `DATABASE_URL` — Neon pooled connection string
- [ ] `POSTGRES_URL` — same as DATABASE_URL (optional, fallback)
- [ ] `NEXTAUTH_SECRET` — random secret ≥ 32 chars (`openssl rand -base64 32`)
- [ ] `NEXTAUTH_URL` — `https://micro-business-suite.vercel.app`
- [ ] `SESSION_MAX_AGE` — `86400` (24h)
- [ ] `LICENSE_SALT` — salt เดียวกับฝั่งผู้ขาย
- [ ] `MBS_LICENSE_KEY` — license key ที่ออกให้ลูกค้า

### Product Mode
- [ ] `PRODUCT_MODE` — `perpetual` (ขายขาด) หรือ `subscription` (เช่า)

### Bridge (Suite → MBS Core)
- [ ] `MBS_BRIDGE_TOKEN` — service-to-service token (ต้องตรงกับ Suite)

### Google Drive Integration (optional)
- [ ] `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `GOOGLE_REDIRECT_URI` — `https://micro-business-suite.vercel.app/api/google-drive/callback`
- [ ] `GOOGLE_TOKEN_ENCRYPTION_KEY` — base64 32 bytes
- [ ] `NEXT_PUBLIC_GOOGLE_API_KEY`

### Gmail (optional)
- [ ] `GMAIL_FROM`
- [ ] `GMAIL_APP_PASSWORD`

### Gemini AI (optional)
- [ ] `GEMINI_API_KEY`

### Recurring Billing (optional)
- [ ] `RECURRING_SECRET`
- [ ] `CRON_ENABLED` — `true` ถ้าต้องการ auto-backup/dashboard

### Seed (optional, ลบหลัง bootstrap)
- [ ] `SEED_ADMIN_EMAIL`
- [ ] `SEED_ADMIN_PASSWORD`
- [ ] `SEED_ADMIN_NAME`
- [ ] `SEED_ADMIN_ROLE`

## Micro-Menu-Online (Suite)

- [ ] `DATABASE_URL` — Prisma Postgres connection string
- [ ] `SESSION_SECRET` — random secret ≥ 32 chars
- [ ] `NEXT_PUBLIC_APP_URL` — production domain
- [ ] `MBS_HUB_URL` — `https://micro-business-suite.vercel.app`
- [ ] `MBS_BRIDGE_TOKEN` — **ต้องตรงกับ MBS Core**
- [ ] `MBS_COMPANY_ID` — company id ใน MBS Core (default 1)

## ตรวจสอบหลังตั้งค่า

```bash
# Health check
curl https://micro-business-suite.vercel.app/api/health  # → 200 {"status":"ok","db":"ok"}

# Smoke test (bridge sync)
node scripts/smoke-test-bridge.mjs
```
