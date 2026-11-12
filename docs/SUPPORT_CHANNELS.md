# Support Channels (Discord + LINE)

อัปเดต: 2026-11-12 · สถานะ: **Core backend implemented** (admin inbox = งานถัดไป)

## โมเดลที่เลือก

- **LINE**: 1 Official Account รวมศูนย์ที่ Core (`Micro-Business-Suite`) — 6 โมดูลไม่ถือ LINE credential
- **Discord**: 1 incoming webhook ต่อ 1 โปรเจกต์ (7 อัน) — แต่ละโปรเจกต์มีค่าของตัวเอง ไม่แชร์ env
- Discord bot (two-way) ยังไม่ทำในรอบนี้; ใช้ webhook แจ้งเตือนทางเดียวก่อน

เหตุผลที่ LINE รวมศูนย์: 1 Messaging API channel ตั้ง webhook ได้ URL เดียว, reply message ไม่นับโควตา, และลดจำนวน secret ที่กระจายอยู่หลาย repo

## Env ต่อโปรเจกต์

ชื่อตัวแปรเหมือนกันทุก repo ค่าต่างกัน:

```env
SUPPORT_PRODUCT_KEY=core          # core | retail | service | rental | hotel | fnb | pharmacy
SUPPORT_PRODUCT_NAME=Micro-Business-Suite
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

เฉพาะ Core:

```env
LINE_CHANNEL_ID=
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=
SUPPORT_TOKEN_ENCRYPTION_KEY=     # openssl rand -base64 32
```

`SUPPORT_TOKEN_ENCRYPTION_KEY` ใช้เข้ารหัส credential ก่อนเก็บลง DB (AES-256-GCM, prefix `enc:v1:`) — ไม่ได้ขอจาก LINE/Discord/Vercel แต่สร้างเอง

## LINE Console setup

1. สร้าง Provider → Messaging API channel
2. เปิด **Use webhook** และใส่ `https://<prod-domain>/api/support/line/webhook`
3. **ปิด Auto-reply messages** (ไม่งั้นลูกค้าได้ 2 คำตอบ)
4. ปรับ/ปิด Greeting messages
5. เปิด **Webhook redelivery**
6. คัดลอก Channel ID / Channel secret / Channel access token ลง env ของ Core

> Vercel Preview deployment มี protection โดยค่าเริ่มต้น — LINE เรียกไม่ถึง ต้องใช้ Production URL หรือปิด protection เฉพาะ deployment ที่ใช้ทดสอบ

## Endpoint

`POST /api/support/line/webhook`

- ไม่ใช้ session cookie (LINE เรียกด้วย cookie ไม่ได้) → อยู่ใน allowlist ของ `proxy.ts`
- ตรวจ `x-line-signature` = HMAC-SHA256(raw body, channel secret) แบบ base64
- idempotency: `support_events` PK `(company_id, provider, event_id)` — LINE retry แล้วไม่สร้างข้อความซ้ำ
- ตอบ 200 เมื่อประมวลผลเสร็จ, 401 signature ผิด, 400 JSON/destination ผิด, 503 ยังไม่ตั้งค่า, 500 เพื่อให้ LINE retry

## Data model

| ตาราง | ใช้ทำอะไร |
|---|---|
| `support_channels` | mapping `provider + external_id → company_id` (LINE destination) |
| `support_threads` | เธรดต่อผู้ใช้ต่อช่องทาง (unique `company_id, channel_id, external_thread_id`) |
| `support_messages` | ข้อความเข้า/ออก + unique `thread_id, provider_message_id` กันซ้ำ + `delivery_status`/`delivery_error` สำหรับข้อความออก |
| `support_events` | event idempotency + สถานะ processing/completed/failed |

Migration: `migrations/add_support_tables.sql` (idempotent, อยู่ใน `scripts/bootstrap-init-db.mjs`)

## API สำหรับ admin inbox (implemented)

ทุก route ต้องมี session cookie และสิทธิ์ `support` (admin/superadmin ผ่านอัตโนมัติ) และถูก scope ด้วย `company_id` ของผู้ใช้เสมอ — thread ของบริษัทอื่นตอบ `404` ไม่ใช่ `403` เพื่อไม่ให้ยืนยันการมีอยู่ของข้อมูล

| Method | Path | สิทธิ์ | ทำอะไร |
|---|---|---|---|
| GET | `/api/support/threads?status=&limit=` | read | รายการ thread + จำนวนข้อความ + ข้อความล่าสุด (mask LINE user id) |
| GET | `/api/support/threads/[id]` | read | thread + ข้อความ 200 รายการล่าสุด (เก่าสุดก่อน) |
| PATCH | `/api/support/threads/[id]` | update | `status` (`open\|pending\|closed`), `priority` (`low\|normal\|high\|urgent`), `assignee_user_id` |
| POST | `/api/support/threads/[id]/messages` | create | ส่งข้อความออก (ตอนนี้รองรับเฉพาะ LINE push) |

`POST .../messages` body: `{ "text": "..." }` (ตัดช่องว่างหัวท้าย, ยาวไม่เกิน 5,000 ตัวอักษร)

พฤติกรรมการส่งออก (honest delivery):

1. บันทึกข้อความ `direction='out'`, `delivery_status='pending'`
2. ยิง LINE push ด้วย `LINE_CHANNEL_ACCESS_TOKEN`
3. อัปเดตเป็น `sent` หรือ `failed` + `delivery_error` (ตัด 300 ตัวอักษร)
4. ตอบ `200` พร้อม `{ delivered: boolean, delivery_status, provider_status }` — **ไม่ลบข้อความที่ส่งไม่สำเร็จ** เพื่อให้ inbox แสดงความจริง
5. provider อื่นที่ไม่ใช่ `line` → `400` (Discord เป็น notification-only ต้องมี bot จึงจะตอบกลับได้)

## พฤติกรรมปัจจุบัน

- ข้อความ LINE เข้า → สร้าง/อัปเดต thread → เก็บข้อความ → ตอบ ack ด้วย reply token (ฟรี) → แจ้ง Discord
- `follow` → ข้อความต้อนรับ
- `postback` → ตอบรับคำขอ
- ถ้า reply token หมดอายุ/ผิด → log warning แต่ยังเก็บข้อความและแจ้ง Discord (ไม่ทำให้ webhook fail)
- ตอบกลับจากทีมงานได้ผ่าน API (push) พร้อมบันทึกสถานะการส่ง
- **ยังไม่มีหน้า UI** — ส่งต่อ Kiro ใน `AI-HANDOFF/requests/REQ-0003-support-inbox-ui.md`

## Security

- ไม่ log webhook URL, channel secret, access token หรือ body เต็ม (อาจมี PII)
- ข้อความลูกค้าเป็น personal data: API จำกัดด้วย session + permission + company scope; UI ต้องไม่แสดง LINE user id เต็ม (API ส่งมาแค่ suffix `…xxxx`)
- `DISCORD_WEBHOOK_URL` เป็น secret: ใครถือก็ยิงข้อความได้
- ห้ามใช้ `.env.local` ของเครื่อง dev ชี้ production DB สำหรับการทดสอบ write

## Access control (implemented)

- `requireSupportActor` (`lib/support-auth.ts`) อนุญาต: role `admin` / `superadmin` / `support` (bypass) หรือสมาชิกกลุ่มที่ได้รับ permission `support` (read/create/update) ผ่าน `group_permissions`
- กลุ่ม `Support` (system group) ถูก seed พร้อม permission `support` read/create/update — ผู้ใช้ที่เพิ่มเข้ากลุ่มนี้จะตอบ/อัปเดตเคสได้โดยไม่ต้องเป็น admin
- `group_permissions` schema ถูกแก้: ลบ column-level UNIQUE ที่ทำให้เก็บหลาย module ต่อกลุ่มไม่ได้, เก็บ composite unique `(group_id, module)` แทน
- ทุก query ถูก scope ด้วย `company_id` — thread ของบริษัทอื่นตอบ 404

## Testing

```bash
npm test                                    # unit: signature + credential encryption
node scripts/bootstrap-init-db.mjs          # apply migration (ตรวจ DB ปลายทางก่อน)
```

ทดสอบ webhook แบบ end-to-end ด้วย payload ที่เซ็นเอง (ต้องมี LINE_CHANNEL_SECRET):

```bash
BODY='{"destination":"Utest","events":[]}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$LINE_CHANNEL_SECRET" -binary | base64)
curl -i -X POST http://localhost:3000/api/support/line/webhook \
  -H "Content-Type: application/json" -H "x-line-signature: $SIG" --data "$BODY"
```

### E2E verification record (2026-11-12)

รันจริงกับ disposable DB ใน Docker (`mbs-integration-pg`, DB `mbs_support_test`) ไม่แตะ Neon:

| การทดสอบ | ผล |
|---|---|
| signature ถูกต้อง → 200 + สร้าง channel/thread/message/event อย่างละ 1 | ผ่าน |
| ส่ง event เดิมซ้ำ (`webhookEventId` เดิม) → 200 แต่ไม่เพิ่มข้อความ | ผ่าน |
| ข้อความใหม่ผู้ใช้เดิม → thread เดิม ข้อความเพิ่มเป็น 2 | ผ่าน |
| ข้อความ non-text (sticker) → 200 และเก็บเป็น `[sticker]` | ผ่าน |
| signature ผิด / ไม่มี signature → 401 | ผ่าน |
| signature ถูกต้องแต่ไม่มี `destination` → 400 | ผ่าน |
| เนื้อหาข้อความที่เก็บตรงกับ payload | ผ่าน |
| Discord webhook จริง → ส่งสำเร็จ ไม่มี warning | ผ่าน |
| Discord ปลายทางล่ม → webhook ยังตอบ 200 และ log warning (ไม่ throw) | ผ่าน |
| migration apply ซ้ำ 3 ครั้ง → idempotent ไม่ error | ผ่าน |

รวม 11/11 checks ต่อรอบ, `npm test` ผ่าน 29/29 (unit 16 ของ support + 13 เดิม)

### E2E verification record — inbox API (2026-11-12)

รันกับ disposable DB แยก (`mbs_support_api_test`) + seeded 2 บริษัท:

| การทดสอบ | ผล |
|---|---|
| ไม่มี session → 401 | ผ่าน |
| มี session แต่ไม่มีสิทธิ์ `support` → 403 | ผ่าน |
| tenant B เห็นเฉพาะ thread ของตัวเอง | ผ่าน |
| tenant A เห็นเฉพาะ thread ของตัวเอง + จำนวนข้อความถูกต้อง | ผ่าน |
| list mask LINE user id (ไม่คืนค่าเต็ม) | ผ่าน |
| thread detail คืนข้อความครบ | ผ่าน |
| เปิด thread ของ tenant อื่น → 404 | ผ่าน |
| `status` ที่ไม่ถูกต้อง → 400 | ผ่าน |
| ข้อความว่าง/มีแต่ช่องว่าง → 400 | ผ่าน |
| ส่งออกไป thread ของ tenant อื่น → 404 | ผ่าน |
| ตอบกลับแล้ว LINE ปฏิเสธ token → 200 + `delivered:false` + `delivery_status=failed` | ผ่าน |
| แถว outbound ใน DB ตรงกับ request (direction/body/status/author) | ผ่าน |
| PATCH status+priority → บันทึกจริง | ผ่าน |
| detail สะท้อนสถานะใหม่และข้อความ 2 รายการ | ผ่าน |

รวม 14/14 checks

หมายเหตุ: การทดสอบใช้ process env override (`POSTGRES_URL`, `DATABASE_URL`, `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN`, `DISCORD_WEBHOOK_URL`, `NEXTAUTH_SECRET` ค่าสำหรับ test) เพราะ `@next/env` ไม่ทับค่าที่มีอยู่ใน `process.env` แล้ว — ไม่มีการแก้ `.env.local` เลย

สคริปต์ที่ใช้ (ไม่ commit, อยู่ใน `tmp/` ซึ่ง gitignore):
- `tmp/run-support-e2e.sh` + `tmp/support-e2e.mjs` = inbound webhook (2 รอบ: Discord จริง / Discord ล่ม)
- `tmp/run-support-inbox-e2e.sh` + `tmp/support-inbox-e2e.mjs` = inbox API (recreate DB + seed เอง)

ห้ามชี้สคริปต์เหล่านี้ไปที่ Neon: มัน `DROP`/`TRUNCATE` ตาราง `support_*`

## สถานะสุดท้าย (2026-11-12 — ปิดงานระบบ support เรียบร้อยแล้ว)

- LINE webhook: URL `https://micro-business-suite.vercel.app/api/support/line/webhook` ตั้งแล้ว + **Verify ผ่านแล้ว** + ตอบ 200 (empty-events ≈1.1s, message-event ≈5.0s) → signature gate + storage + Discord notify ทำงานร่วมกัน
- `/admin/support` inbox UI: เสร็จสมบูรณ์ (`app/admin/support/page.tsx`, 468 บรรทัด) ถูก commit + รวมกับ backend (`REQ-0003`, status `completed-by-kiro`)
- Production: migration + env vars (Core/6 modules) + deploy + smoke test (401/307/200) เรียบร้อย

## งานที่เหลือ (ถ้ายังต้องเช่นกัน)

1. กรอก `DISCORD_WEBHOOK_URL` ต่อโปรเจกต์ module ที่ยังว่าง (Retail/Service/Rental/Hotel/Pharmacy) + deploy module นั้น
2. Discord bot (interactions) สำหรับตอบกลับใน Discord — ถ้าจำเป็น
3. Seed user จริงเข้ากลุ่ม `Support` / กำหนด retention ข้อความลูกค้า

## งานถัดไขไม่งั้นจะถือว่างานไม่เสร็จ
