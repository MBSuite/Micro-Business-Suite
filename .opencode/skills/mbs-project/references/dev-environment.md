# Dev Environment & Scripts

## Local dev server
- **พอร์ต 3000 ถูก `open-webui` (uvicorn) ครอบไว้บนเครื่อง — ห้ามใช้** ใช้ **3001** เสมอ
- เปิดพร้อม log + ทนต่อ bash kill (process group):
```bash
setsid nohup node node_modules/next/dist/bin/next dev -p 3001 \
  >/tmp/opencode/mbs-dev-3001.log 2>&1 < /dev/null &
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/   # 307 (redirect login) = พร้อม
```
- ปิด: **kill เจาะ PID** (`ss -tlnp | grep 3001` หา pid) — ห้าม `pkill -f` pattern ที่ชน command ตัวเอง
- Dev server โหลด `.env.local` (39 entries) → ต่อ **prod DB จริง**; ทุก action กับข้อมูลจริง

## Probe/ฝั่ง node script ต่อ DB
```bash
node --input-type=module -e '
import { config } from "dotenv";
config({ path: ".env.local" });               // ต้อง config ก่อน import lib/db
const { query } = await import("./lib/db.ts");
const r = await query("SELECT ... ", [...]);
console.log(r.rows);
process.exit(0);
'
```
- เตือน `MODULE_TYPELESS_PACKAGE_JSON` / `Reparsing as ES module` = noise ไม่กระทบ
- ถ้าเชื่อม postgres ไม่ใช่ Neon (เช่น container ท้องถิ่น) ต้อง URL ต่อท้าย `?sslmode=disable` (ดู db-schema ref)

## Superadmin / credential
- บัญชี: `admin@mbsuite.app` (id=1, superadmin, company_id=1) — seeded ตั้งแต่ bootstrap ครั้งแรก
- วิธีหา/รีเซ็ต/เข้า admin console: ดู skill **[../../mbs-admin-access/SKILL.md](../../mbs-admin-access/SKILL.md)**
- Password reset เขียนไฟล์ `.secure/initial-admin-credential.txt` (mode 0600, git-ignored) — ห้ามพิมพ์เต็มลง chat
- `scripts/bootstrap-seed-admin.mjs`: seed superadmin (PROFESSIONAL/5 users/expiry 2027-12-31);
  **skip ทันทีถ้า admin@mbsuite.app มีอยู่** (ไม่สร้าง credential file)

## Scripts / เครื่องมือ repo
| ชื่อ | ใช้ทำอะไร |
|---|---|
| `pnpm dev` | dev server (ใช้ `-p 3001` ตามข้างบน) |
| `pnpm test` | 8 unit (6 integration test แยกผ่าน harness) |
| `pnpm test:integration` | `node tests/integration/run.mjs` (harness 6/6) |
| `npm run <lint/build>` | ตาม package.json; lint ไฟล์ใหม่ 0 error; tsc clean ยกเว้น baseline `tests/taxAutomator.test.ts`; build OK |
| `pnpm license:issue -- --mode perpetual --company "X" --licensee a@b.com --max-users 5` | CLI flags เต็ม — ดู `scripts/issue-license.mjs` |
| `pnpm license:quick` | **interactive ถามทีละขั้น** — ตอบ type/mode/company/licensee/max_users/max_tx (subscription เพิ่ม expires) → ปริ้น key + บันทึก `.secure/licenses/<slug>-<yyyymmdd>.key` (0600) |
| `npx eslint <file>` | lint เฉพาะไฟล์ |
| `scripts/bootstrap-seed-admin.mjs` | seed superadmin (ดูข้างบน) |
| `scripts/weekly-consistency-audit.mjs` | audit รายสัปดาห์ (mention super_admin regex) |
| `migrations/*.sql` | schema migrations; `add_customer_subscription.sql` รัน Neon แล้ว |

## สิ่งที่ยังค้าง (relevant)
- WS-3 #4: `company_id` บน quotations/expenses/ฯลฯ + UNIQUE `users.email`
- deploy ยังไม่เริ่ม (รอพี่ทดลอง local จบ)
- workflow ปกติ: ฌอน implement → ธาร review/approve → พี่ทดลองก่อน deploy → deploy