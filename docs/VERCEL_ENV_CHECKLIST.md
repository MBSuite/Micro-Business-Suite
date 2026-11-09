# Vercel Environment Variables Checklist — MBS Core + Micro-Menu-Online

ตั้งค่าใน Vercel Dashboard → Project → Settings → Environment Variables
เลือก Environment: Production (และ Preview ถ้าต้องการ)

## MBS Core (micro-business-suite)

| Variable | Required | ค่า / หมายเหตุ |
|---|---|---|
| `POSTGRES_URL` หรือ `DATABASE_URL` | ✅ | Supabase PostgreSQL URL สำหรับ Production runtime (ห้ามใช้ Neon Dev URL) |
| `DATABASE_URL_UNPOOLED` (optional) | ⚪ | Direct URL ของ environment เป้าหมายสำหรับ migration เท่านั้น; ตรวจ target และขออนุมัติก่อน |
| `NEXTAUTH_SECRET` หรือ `AUTH_SECRET` | ✅ | JWT secret (มีอยู่แล้ว) |
| `MBS_BRIDGE_TOKEN` | ✅ | service-to-service token (ต้องตรงกับ Suite) |
| `PRODUCT_MODE` | ✅ | `perpetual` (มีอยู่แล้ว) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | ✅ | (มีอยู่แล้ว) |
| `GOOGLE_TOKEN_ENCRYPTION_KEY` | ✅ | (มีอยู่แล้ว) |
| `GEMINI_API_KEY` | ✅ | (มีอยู่แล้ว) |
| `MBS_LICENSE_KEY` / `LICENSE_SALT` | ✅ | (มีอยู่แล้ว) |

## Micro-Menu-Online (menu online)

| Variable | Required | ค่า / หมายเหตุ |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `SESSION_SECRET` | ✅ | ≥ 32 chars (มีอยู่แล้ว) |
| `NEXT_PUBLIC_APP_URL` | ✅ | production domain |
| `MBS_HUB_URL` | ✅ (ถ้า sync) | `https://micro-business-suite.vercel.app` |
| `MBS_BRIDGE_TOKEN` | ✅ (ถ้า sync) | **ต้องตรงกับ MBS Core** |
| `MBS_COMPANY_ID` | ✅ (ถ้า sync) | default `1` (company_id ใน MBS Core) |

## วิธีตั้งค่า (Vercel CLI with token)
```bash
# ตัวอย่าง (ใช้ vercel-cli-with-tokens skill)
vercel env add MBS_BRIDGE_TOKEN production
# paste value when prompted
```
หรือใช้ Vercel Dashboard → Settings → Environment Variables → Add.

## วิธี verify (masked)
```bash
# MBS Core
vercel env ls | grep -i bridge
# Micro-Menu-Online
vercel env ls | grep -iE 'hub|bridge|company'
```

## ข้อควรระวัง
- `MBS_BRIDGE_TOKEN` ต้อง **ตรงกันทั้งสองโปรเจกต์** (เปรียบเทียบ masked: `echo $MBS_BRIDGE_TOKEN | cut -c1-4` และ `... | tail -c5`)
- ถ้าต้องการ **standalone mode** (ไม่ sync) — ปล่อย `MBS_HUB_URL` / `MBS_BRIDGE_TOKEN` ว่างใน Micro-Menu-Online (no-op, ไม่ error)
- ห้าม commit `.env.local` หรือ token ลง Git (`.gitignore` กันไว้แล้ว)
- หลังตั้ง env ต้อง **redeploy** ทั้งสองโปรเจกต์ให้ env ใหม่มีผล

## Smoke test หลัง deploy
```bash
# MBS Core directory
MBS_HUB_URL=https://micro-business-suite.vercel.app \
MBS_BRIDGE_TOKEN=<token> \
MBS_COMPANY_ID=1 \
node scripts/smoke-test-bridge.mjs
```
- ตรวจ metadata แบบ read-only โดยส่ง service credential ใน `Authorization`
  header (ห้ามใส่ token ใน URL หรือบันทึกลงเอกสาร):
```bash
curl --fail-with-body --silent --show-error \
  -H "Authorization: Bearer ${MBS_BRIDGE_TOKEN}" \
  https://micro-business-suite.vercel.app/api/bridge/sync
```
- `GET /api/bridge/sync` ต้องใช้ `MBS_BRIDGE_TOKEN` แบบ Bearer หรือ session
  cookie ของผู้ใช้ที่ล็อกอิน; หากไม่มี credentials ควรได้ `401`.
- โค้ดและการตรวจแบบ integration บนฐานข้อมูล disposable ผ่านแล้ว แต่ยังไม่ได้
  deploy/ยืนยัน GET นี้บน production; อย่าถือว่า production ผ่านจนกว่าจะตรวจหลัง deploy.
- Production ใช้ Supabase ตามที่เจ้าของยืนยัน; Neon ใช้ฝั่ง Dev. ก่อนพิจารณา
  production ต้องผ่านการทดสอบ signup/delete บน Dev และทำ/ตรวจ 2FA ก่อน.
- Dry run (read-only, ไม่สร้างข้อมูล): เพิ่ม `--dry-run`
- Non-dry-run จะสร้าง invoice + journal entry จริงใน production DB (cleanup ถ้าต้องการ)
