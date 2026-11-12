# REQ-0003: Core admin UI — support inbox (LINE)

- Status: completed-by-kiro
- Requester: OpenCode
- Owner: Kiro
- Screens/routes: `/admin/support` (suggested), optional thread detail panel on the same route
- Related files: `app/api/support/threads/**`, `lib/support-auth.ts`, `lib/support-outbound.ts`, `docs/SUPPORT_CHANNELS.md`
- Backend status: implemented and tested end-to-end against a disposable database **not deployed**

## Goal / user need

Core admin/ทีมซัพพอร์ตต้องดูข้อความลูกค้าที่เข้ามาทาง LINE Official Account แล้วตอบกลับได้ในหน้าเดียว โดยไม่ต้องเปิด LINE OA Manager และไม่เห็น credential ใด ๆ ใน UI

## Screens

1. **Inbox list** — รายการ thread เรียงตามกิจกรรมล่าสุด แสดง:
   - provider + channel name (`LINE Official Account`)
   - `external_thread_id_hint` (เช่น `…0001`) — ห้ามแสดง id เต็ม
   - `last_message` (ตัด 1–2 บรรทัด), `message_count`, `last_message_at`
   - badge `status` (open/pending/closed) และ `priority` (low/normal/high/urgent)
2. **Thread detail** — ข้อความทั้งหมด (in/out) พร้อมเวลา, ช่องพิมพ์ตอบกลับ, ปุ่มเปลี่ยน status/priority
3. **สถานะการส่ง** — ข้อความ out ที่ส่งไม่สำเร็จต้องแสดงเตือน (ไม่ใช่เงียบ) เพราะ API คืน `delivered:false`

## API contract (implemented)

ทุก route ใช้ session cookie ปกติ (ไม่ต้องมี header พิเศษ) — 401 = ยังไม่ login, 403 = ไม่มีสิทธิ์ `support`

### `GET /api/support/threads?status=open&limit=50`

```json
{
  "success": true,
  "data": [
    {
      "id": 12,
      "channel_id": 1,
      "provider": "line",
      "channel_name": "LINE Official Account",
      "external_thread_id_hint": "…0001",
      "subject": null,
      "status": "open",
      "priority": "normal",
      "assignee_user_id": null,
      "message_count": 3,
      "last_message": "ข้อความล่าสุด",
      "last_message_at": "2026-11-12T09:00:00.000Z",
      "created_at": "2026-11-12T08:00:00.000Z"
    }
  ]
}
```

- `status` ไม่ใส่ = ทั้งหมด; ค่าที่รับ `open|pending|closed`; ค่าอื่น → 400
- `limit` 1–100 (default 50)

### `GET /api/support/threads/[id]`

```json
{
  "success": true,
  "data": {
    "thread": { "id": 12, "provider": "line", "status": "open", "priority": "normal", "external_thread_id_hint": "…0001", "last_message_at": "…", "created_at": "…", "updated_at": "…" },
    "messages": [
      { "id": 30, "direction": "in", "author_user_id": null, "body": "…", "delivery_status": null, "created_at": "…" },
      { "id": 31, "direction": "out", "author_user_id": 1, "body": "…", "delivery_status": "sent", "created_at": "…" }
    ],
    "message_page_size": 200
  }
}
```

- 404 เมื่อ thread ไม่มีอยู่ **หรืออยู่บริษัทอื่น** (อย่าแสดงข้อความที่บ่งชี้ว่ามีอยู่จริง)

### `PATCH /api/support/threads/[id]`

Body (ส่งได้อย่างน้อย 1 field):

```json
{ "status": "closed", "priority": "high", "assignee_user_id": null }
```

- `status`: `open|pending|closed`
- `priority`: `low|normal|high|urgent`
- `assignee_user_id`: number หรือ `null` เพื่อเอาออก
- 400 เมื่อไม่มี field ที่รองรับ หรือค่าไม่ถูกต้อง; 404 เมื่อไม่ใช่ thread ของบริษัทผู้ใช้

### `POST /api/support/threads/[id]/messages`

Body:

```json
{ "text": "ตอบกลับจากทีมงาน" }
```

Success `200` (บันทึกแล้ว — แต่ต้องอ่าน `delivered`):

```json
{ "success": true, "data": { "message_id": 31, "delivered": false, "delivery_status": "failed", "provider_status": 401 } }
```

- 400 เมื่อข้อความว่าง/ยาวเกิน 5,000/`text` ไม่ใช่ string
- 400 เมื่อ provider ไม่ใช่ `line` (ยังไม่รองรับ outbound ของ Discord)
- 404 เมื่อ thread อยู่บริษัทอื่น
- **ห้ามถือว่า 200 = ส่งถึงลูกค้า** ต้องดู `delivered`; ถ้า `false` ให้แสดง warning ว่า "บันทึกแล้วแต่ส่งไม่สำเร็จ"

## UX rules

- ห้ามแสดง `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN`, `DISCORD_WEBHOOK_URL` หรือค่า env ใด ๆ ใน UI
- ห้าม log ข้อความลูกค้าเต็มใน console ฝั่ง client
- ข้อความลูกค้าเป็น personal data: อย่าใส่ลง URL/query string, อย่า cache ข้ามผู้ใช้
- ปุ่มตอบกลับต้อง disable ระหว่างส่ง และต้องแสดงผลลัพธ์ตาม `delivered`

## Acceptance criteria

1. `/admin/support` เข้าได้เฉพาะผู้มีสิทธิ์; user ที่ไม่มีสิทธิ์เห็น permission-denied (ไม่ใช่หน้าว่าง)
2. เปิด thread แล้วเห็นข้อความเรียงตามเวลา และตอบกลับได้
3. ตอบกลับสำเร็จ → ข้อความ out ปรากฏใน thread พร้อมสถานะ `sent`
4. ตอบกลับไม่สำเร็จ → ข้อความยังอยู่ใน thread พร้อมสถานะ `failed` และมี warning ชัดเจน
5. เปลี่ยน status/priority แล้วรีเฟรชยังคงอยู่
6. ไม่มี secret ใด ๆ ปรากฏใน DOM, network response, หรือ console
7. `npx tsc --noEmit` และ `npx eslint` ผ่าน

## Verification expected from Kiro

- ระบุ route/ไฟล์ที่แตะ, ผล tsc/eslint, และภาพหน้าจอ (list/detail/error state)
- ห้ามแก้ backend (`app/api/support/**`, `lib/support-*.ts`, migration) — ถ้าต้องการ field เพิ่ม ให้เปิด REQ กลับมาที่ OpenCode
