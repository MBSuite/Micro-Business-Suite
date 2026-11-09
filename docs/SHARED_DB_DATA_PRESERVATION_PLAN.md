# แผนรักษาข้อมูลเดิม + DB Role Grants (Shared Database)

> **สถานะ: DRAFT — รอพี่ฆังตรวจ**
> เอกสารนี้เป็น **inventory + ข้อเสนอ** เท่านั้น ยังไม่ใช่อนุมัติให้สร้าง/รัน migration, เปลี่ยน schema/ข้อมูลจริง, ตั้งค่า Vercel, deploy หรือประกาศ production-ready
> G1/G1b เสร็จแล้ว (docs/G1B_RESULTS.md); G2 เสร็จแล้ว (docs/G2_RESULTS.md); G3 (production source inventory) ยังรอการตรวจและอนุมัติแยก
>
> วันที่จัดทำ: 2026-11-08 · ผู้จัดทำ: OpenCode (backend/system) · ผู้อนุมัติ: เจ้าของ (พี่ฆัง)
> อ้างอิง: `docs/HANDOFF.md` §13, `AGENTS.md`
>
> **Revision 2 (2026-11-08):** ปรับตามข้อท้วง 5 ประเด็น — (1) การรวมฐานข้อมูล (2) shared identity/users กับ Core (3) tenant scope ของ `store_settings`/`prescription_items` (4) ขอบเขตสิทธิ์ migrator/ownership (5) rollback การ remap company ID
>
> **Revision 3 (2026-11-08):** ปรับตามข้อท้วงรอบ 2 — (1) แยกจังหวะ read-only inventory ออกจาก Vercel env ตาม HANDOFF §13 step 7 (2) เพิ่ม runbook data consolidation + ปัญหา `_prisma_migrations` ร่วม (3) แยกคำถามที่ขวาง Docker กับที่ขวาง Neon/Production (4) ยืนยัน namespace = public + prefix ตาม HANDOFF (ตัด schema-per-module ออกจากตัวเลือก) (5) ระบุสัญญา SSO (issuer/audience/claims/revocation/rotation) — ภายหลังถูกถอดออก 2026-11-09 (6) บังคับ inventory key จริงก่อน backfill `store_settings`
>
> **Revision 4 (2026-11-08):** ปรับตามข้อท้วงรอบ 3 — (1) เขียนวิธี staging ที่รันได้จริง (`pg_dump --data-only` ไม่สร้างตาราง/ไม่ย้าย schema) (2) เลือกเส้นทาง rename vs import ตามชนิด source ให้ชัด (3) ระบุสิทธิ์ของ `_prisma_migrations` ledger ต่อทางเลือก A/B/C (4) ระบุว่า Neon branch สืบทอดข้อมูลจาก parent — ต้องใช้ parent ว่าง/project ใหม่
>
> **Revision 5 (2026-11-08):** ปรับตามข้อท้วงรอบ 4 — (1) แก้ staging DDL ที่อ้าง `public.<t>` ข้าม database ไม่ได้ → สร้างจาก **ตาราง target prefixed** `public.mbs_<module>_<t>` + เพิ่มขั้นตรวจ column/type compatibility ก่อนโหลด (2) ระบุว่า A เป็นสมมติฐาน + เพิ่ม Docker test matrix T1–T7 ครอบ ledger creation/grants/sequential deploy/idempotent (3) ลดความเสี่ยง Neon: project ใหม่ > DB ใหม่ใน branch > `DROP SCHEMA public` เฉพาะ disposable ที่ยืนยัน + backup (4) แก้ถ้อยคำ `DECISIONS.md` ไม่กล่าวอ้างการอนุมัติ Revision 3 (5) เพิ่ม D6 + G1b เพื่อไม่ให้ gate map ข้ามงาน implement prefixed migration
>
> **Revision 6 (2026-11-08):** ปรับตามข้อท้วงรอบ 5 — (1) เพิ่ม §2.6.1.1 การเทียบชนิดข้อมูล + enum mapping (เทียบ labels/ลำดับจาก `pg_enum` ไม่เทียบ `udt_name` ตรงๆ) (2) แก้ `DECISIONS.md` รายการ Revision 2/3 ให้ไม่กล่าวอ้างการอนุมัติ (3) เพิ่มตาราง "การอนุมัติแยกส่วน" ใน §7 ยืนยันว่า G0 (อนุมัติเอกสาร) ไม่เท่ากับ D4/D5/D6 (อนุมัติสร้าง/รันฐานทดสอบ)
>
> **Revision 7 (2026-11-08):** ปรับตามข้อท้วงรอบ 6 — แก้คำแนะนำการโหลดค่า enum ใน §2.6.1.1: ตัวอย่างเดิม `col::text::public.mbs_<module>_<enum>` ใช้ไม่ได้เพราะชื่อ enum ของ target ไม่มีอยู่ใน source database → เปลี่ยนเป็น **ฝั่ง source ส่ง `col::text` เท่านั้น** และให้ `\copy`/`INSERT` ฝั่ง target แปลง text เป็นชนิดคอลัมน์ staging (ซึ่งสร้างจาก target prefixed table จึงเป็น enum ของ target อยู่แล้ว) + ระบุให้หยุดรายงานถ้า target ปฏิเสธค่า enum
>
> **Revision 8 (2026-11-08):** บันทึกผล G1 synthetic Docker rehearsal (Prisma 7.10.0, PostgreSQL 16.15, fixture 3 โมดูล): ทางเลือก A ผ่านการ deploy แบบเรียงลำดับเมื่อ ledger มีสิทธิ์ครบ แต่พบ silent skip เมื่อชื่อ migration ซ้ำ, P3009 กระทบทุกโมดูลเมื่อมี failed row, และ race เมื่อ deploy พร้อมกัน; เพิ่มเงื่อนไขการตั้งชื่อ migration, bootstrap/grant ledger, serial deploy, failure recovery และ explicit grants ใน §2.6.3. G1b และ Neon/Production ยังไม่ผ่านหรือได้รับอนุมัติจากผลนี้

---

## 1. ขอบเขต

| ทำ (ได้รับอนุมัติ) | ไม่ทำ (ยังไม่อนุมัติ) |
|---|---|
| Inventory แหล่งฐานข้อมูลของแต่ละ module | สร้าง/รัน migration |
| ข้อเสนอแผนรักษาข้อมูลเดิม | เปลี่ยน schema / ข้อมูลจริง |
| ข้อเสนอ DB role + grants | ตั้งค่า Vercel env |
| แผน rollback | deploy / ประกาศ production-ready |
| | Docker rehearsal / Neon branch rehearsal (รออนุมัติแยก) |

---

## 2. Inventory แหล่งฐานข้อมูล

### 2.1 Local development (อ่านจาก `.env` ที่ gitignore — secret ถูก mask)

| Module | `.env` | Host / Database | User | `MBS_COMPANY_ID` | `MBS_HUB_URL` | `MBS_BRIDGE_TOKEN` | `SESSION_SECRET` |
|---|---|---|---|---|---|---|---|
| Service | มี | `localhost:5432/menu_online` | `postgres` | `1` | ว่าง (standalone) | ว่าง | placeholder (local only) |
| Retail | มี | `localhost:5432/menu_online` | `postgres` | `1` | ว่าง | ว่าง | placeholder (local only) |
| Rental | มี | `localhost:5432/menu_online` | `postgres` | `1` | ว่าง | ว่าง | placeholder (local only) |
| Pharmacy | มี | `localhost:5432/menu_online` | `postgres` | `1` | ว่าง | ว่าง | placeholder (local only) |
| Hotel | มี | `localhost:5432/menu_online` | `postgres` | `1` | ว่าง | ว่าง | placeholder (local only) |
| F&B | **ไม่มี** (มีแต่ `.env.example`) | — | — | (example = 1) | (ว่าง) | (ว่าง) | (placeholder) |

**ข้อเท็จจริงที่ตรวจได้:**
- `.env` ทั้ง 5 module ชี้ **ฐานข้อมูลเดียวกันชื่อ `menu_online`** (user `postgres`) — ถ้า local PostgreSQL รันพร้อมกันทุก module จะชนกันทันที เพราะตารางยัง unprefixed
- `.env.local` ของทุก module มีเฉพาะ `VERCEL_OIDC_TOKEN` ไม่มี DB URL
- `.env` ถูก gitignore และไม่ถูก track ใน git ✅ (secret ไม่หลุดเข้า repo)
- **local PostgreSQL ไม่ได้รันอยู่** (`localhost:5432 - no response`) → ยังตรวจ row count ไม่ได้ และไม่มีหลักฐานว่ามีข้อมูล local ที่ต้องรักษา
- `SESSION_SECRET` ใน `.env` เป็น placeholder ตัวเดียวกับ `.env.example` → เป็น local dev เท่านั้น ไม่ใช่ production secret

### 2.2 Production (ยังไม่ทราบ — แยกจังหวะการเข้าถึงตาม HANDOFF §13 step 7)

| Module | Production `DATABASE_URL` | สถานะ |
|---|---|---|
| ทั้ง 6 | ค่าจริงอยู่ใน Vercel project ของแต่ละ module | **ไม่ทราบในขั้นนี้** — Vercel env อยู่นอกขอบเขตที่ได้รับอนุมัติ (HANDOFF step 7) |

**การแยกจังหวะ (แก้ความขัดกันระหว่าง "ต้องรู้ production ก่อน rehearsal" กับ "ห้ามขอ Vercel ก่อน rehearsal ผ่าน"):**

| Gate | ต้องรู้อะไร | ไม่ต้องรู้ |
|---|---|---|
| Docker rehearsal | แค่ fixture + migration ของ module | **ไม่ต้องรู้** production URL/row counts/company mapping; **ไม่แตะ Vercel** |
| Neon disposable branch | สร้าง branch ใหม่ (ว่าง) + direct URL ของ branch นั้น | **ไม่ต้องอ่าน production source**; ไม่แตะ Vercel env |
| Production source inventory | ต้องได้ **read-only metadata** ของ production source (owner อนุญาตแยก) | ไม่แก้ env, ไม่ deploy |
| Env change/deploy | ค่าจริงครบ + checklist ผ่าน | — |

> **ข้อกำหนด:** การอ่าน production source เป็น **read-only metadata inspection** (รายชื่อตาราง/enum/row count/version) แยกจาก "แก้ Vercel env" โดยสิ้นเชิง — ทำได้เฉพาะเมื่อเจ้าของอนุมัติขั้นนั้นแยก และ **ไม่พิมพ์ connection string/token** ในรายงาน
> **ห้ามถือว่า production ว่าง** — HANDOFF ระบุชัด "do not assume there are no existing module records"

### 2.3 Migrations ที่มีอยู่ในแต่ละ module (ปัจจุบัน)

| Module | Migrations |
|---|---|
| Service | `0_init`, `20260906175746_add_store_settings`, `20260907120000_batch_receipt_number`, `20261107_add_company_id`, `20261107_add_booking` |
| Retail | `0_init`, `20260906175746_add_store_settings`, `20260907120000_batch_receipt_number`, `20261107_add_company_id`, `20261107_add_promotion` |
| Rental | `0_init`, `20260906175746_add_store_settings`, `20260907120000_batch_receipt_number`, `20261107_add_company_id`, `20261107_add_rental` |
| Pharmacy | `0_init`, `20260906175746_add_store_settings`, `20260907120000_batch_receipt_number`, `20261107_add_company_id`, `20261107_add_pharmacy` |
| Hotel | `0_init`, `20260906175746_add_store_settings`, `20260907120000_batch_receipt_number`, `20261107_add_company_id`, `20261107_add_hotel` |
| F&B | `0_init`, `20260906175746_add_store_settings`, `20260907120000_batch_receipt_number`, `20261107_add_company_id` |

หมายเหตุ: `20260907120000_batch_receipt_number` มีเพียง `DROP INDEX IF EXISTS "orders_receipt_number_key";`

### 2.4 ตาราง / enum ปัจจุบัน → ชื่อ target (prefix)

**Enum ที่ทุก module ใช้ชื่อซ้ำกัน (unprefixed):** `Role`, `OrderStatus`, `OrderSource`, `ItemStatus`, `PaymentMethod`
→ target: `mbs_<module>_role`, `mbs_<module>_order_status`, `mbs_<module>_order_source`, `mbs_<module>_item_status`, `mbs_<module>_payment_method`

| Module | ตารางปัจจุบัน (unprefixed) | Domain table เพิ่มเติม |
|---|---|---|
| Service (`mbs_service_`) | `users`, `categories`, `products`, `tables`, `orders`, `order_items`, `payments`, `store_settings` | `bookings` |
| Retail (`mbs_retail_`) | ชุดเดียวกัน | `promotions` |
| Rental (`mbs_rental_`) | ชุดเดียวกัน | `assets`, `contracts`, `rents`, `maintenance` |
| Pharmacy (`mbs_pharmacy_`) | ชุดเดียวกัน | `prescriptions`, `prescription_items`, `stock_batches` |
| Hotel (`mbs_hotel_`) | ชุดเดียวกัน | `rooms`, `bookings`, `housekeeping` |
| F&B (`mbs_fnb_`) | ชุดเดียวกัน | ไม่มี |

### 2.5 การครอบ `companyId` ในปัจจุบัน

- ตารางที่มี `companyId`: `users`, `categories`, `products`, `tables`, `orders`, `order_items`, `payments` + domain tables ส่วนใหญ่
- ตารางที่ **ไม่มี** `companyId`: `store_settings` (ทุก module), `prescription_items` (Pharmacy)
- Migration `20261107_add_company_id` เพิ่ม column + **backfill `company_id = '1'`** ให้ 7 ตาราง: `users`, `categories`, `products`, `tables`, `orders`, `order_items`, `payments`
- Domain tables ที่สร้างภายหลัง (`bookings`, `promotions`, `assets`, …) มี column `company_id` ตั้งแต่ CREATE TABLE แต่ **ไม่มี backfill** (ตารางว่างตอนสร้าง)
- Prisma ประกาศ `companyId String?` (nullable) — ยังไม่บังคับ NOT NULL

### 2.6 การรวมฐานข้อมูล (DB consolidation) — ประเด็นที่ต้องตัดสินก่อน rename

**ปัญหา:** การ rename ตารางในแต่ละฐานไม่ตอบคำถามว่าจะย้าย/รวมข้อมูลจากหลาย source เข้า shared DB อย่างไร

**Source matrix (ข้อเท็จจริงปัจจุบัน):**

| Source | สถานะ | ข้อมูล | วิธี consolidate |
|---|---|---|---|
| Local `menu_online` (5 module ชี้ร่วม) | PostgreSQL ปิดอยู่ (ตรวจไม่ได้) | ไม่มีหลักฐาน; ตาราง unprefixed ชื่อซ้ำกันทั้ง 5 module → **แยก provenance ไม่ได้** | **ห้าม import เป็นค่าเริ่มต้น** — ถือเป็น disposable dev DB; ต้องให้เจ้าของยืนยันถ้าต้องการรักษา |
| F&B local | ไม่มี `.env` | ไม่มี | สร้าง schema ใหม่ใน shared DB |
| Production module ×6 | ไม่ทราบ (Vercel env) | **ห้ามถือว่าว่าง** | ต้อง inventory read-only ก่อน; ถ้ามีข้อมูลใช้ import plan ด้านล่าง |

**Decision tree ต่อ module:**
1. Read-only inventory source: มี DB/ตารางอะไร, row count ต่อตาราง, owner, PostgreSQL version
2. ถ้า source ว่าง/ไม่มีข้อมูล → สร้าง prefixed schema ใน shared DB ตรงๆ (ไม่ import)
3. ถ้ามีข้อมูล → export ต่อตารางด้วย `\copy ... TO STDOUT WITH (FORMAT csv)` (ไม่ใช้ `pg_dump --data-only` ตรงๆ เพราะไม่สร้างตาราง/ไม่ย้าย schema) → import เข้า staging schema `stg_<module>` ตาม §2.6.1 → ตรวจ count/FK → `INSERT ... SELECT` เข้า prefixed tables ตามลำดับ FK → ตรวจ count/checksum → cutover
4. Cutover: maintenance window + freeze writes → final delta → verify → สลับ `DATABASE_URL` → smoke test
5. Rollback: restore snapshot (ตาม §5)

#### 2.6.1 Runbook การสร้าง schema เป้าหมาย (ตอบข้อท้วงข้อ 2)

**หลักการ:** target schema ถูกสร้างโดย **migration ชุดใหม่ที่ prefixed แล้ว** เท่านั้น — **ห้ามรัน migration unprefixed ชุดเดิม (`0_init` ฯลฯ) บน shared DB**

**ข้อเท็จจริงเรื่องเครื่องมือ (แก้ข้อท้วงรอบ 3 และรอบ 4):**
- `pg_dump --data-only` **ไม่สร้างตาราง** และ output อ้างชื่อ schema ต้นทาง (`COPY public.<t> ...`) → ถ้าโหลดตรงๆ จะเขียนลงตาราง unprefixed ไม่ใช่ `stg_<module>`
- `CREATE TABLE ... (LIKE ...)` **ใช้ข้าม database ไม่ได้** — ในกรณี S2 ตาราง `public.<t>` อยู่ที่ **source** ไม่ใช่ target ดังนั้น staging DDL ต้องอ้าง **ตาราง target ที่ prefixed แล้ว** (`public.mbs_<module>_<t>`) ใน target DB เดียวกันเท่านั้น — **ห้ามใช้ `LIKE public.<t>` ใน target**
- `\copy` เป็นคำสั่งฝั่ง client ของ `psql` จึงอ่านจาก source แล้วเขียนลง target ที่อยู่คนละ DB/server ได้ โดยไม่ต้องติดตั้ง extension ใดๆ
- ถ้า source/target อยู่ server เดียวกัน อาจใช้ `postgres_fdw`/`dblink` ได้ แต่ **ไม่ใช่ค่าเริ่มต้น** และต้องขออนุมัติแยก

| ขั้น | คำสั่ง/เงื่อนไข (รันได้จริง) | ผลลัพธ์ที่ต้องตรวจ |
|---|---|---|
| 1. สร้าง target | shared DB ว่าง → รัน migration prefixed ของ module ตามลำดับ dependency | object ครบ, ชื่อมี prefix, ไม่มีชื่อชน |
| 2. ตรวจความเข้ากันได้ของคอลัมน์ (ก่อนสร้าง staging) | ดึง metadata สองฝั่งด้วย query เดียวกัน: `SELECT table_name, column_name, data_type, udt_name, is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name IN (<รายชื่อตาราง>) ORDER BY table_name, ordinal_position;` — ฝั่ง source ใช้ชื่อ `<t>`, ฝั่ง target ใช้ `mbs_<module>_<t>` แล้วทำ mapping ตาราง/คอลัมน์ + **ตรวจ enum ตาม §2.6.1.1** | ทุกตาราง target มีคอลัมน์ครบ; ถ้าคอลัมน์ source ไม่มีใน target, target ไม่มีใน source, หรือ type ไม่ตรง (หลัง normalize/mapping ตาม §2.6.1.1) → **หยุด รายงานเจ้าของพร้อม mapping ที่เสนอ** (ห้ามเดา cast เอง) |
| 3. สร้างโครง staging | ใน **target DB เดียวกัน**: `CREATE SCHEMA stg_<module>;` + ต่อตาราง `CREATE TABLE stg_<module>.<t> (LIKE public.mbs_<module>_<t> INCLUDING DEFAULTS);` — อ้าง **ตาราง target prefixed** (ไม่ใช่ `public.<t>`) | จำนวนตาราง/คอลัมน์ตรง target prefixed |
| 4. โหลดข้อมูลเข้า staging | **ต่อตาราง** ด้วย `psql` สองฝั่ง: `psql "$SOURCE" -c "\copy (SELECT <source_cols> FROM public.<t>) TO STDOUT WITH (FORMAT csv)" \| psql "$TARGET" -c "\copy stg_<module>.<t> (<target_cols>) FROM STDIN WITH (FORMAT csv)"` — `<source_cols>` ส่งค่า enum ออกเป็น **text** (`col::text`) ตาม §2.6.1.1; ห้ามอ้างชื่อ enum/ตารางของ target ใน query ฝั่ง source (คนละ database) | row count ต่อตารางตรง source; ถ้า `\copy` ฝั่ง target ล้มด้วย `invalid input value for enum` → **หยุด รายงาน** (ห้ามแก้ค่า enum เอง) |
| 5. Mapping/ID | ค่า `company_id` ตาม §3.4; **ID คงค่าเดิม** (preserve UUID/text PK) เพื่อให้ FK ภายใน module ยังชี้ถูก | ไม่มี orphan FK |
| 6. Copy ตามลำดับ FK | `INSERT INTO public.mbs_<module>_<t> (<cols>) SELECT <cols> FROM stg_<module>.<t>` ตาม topological order (parent → child) | count ต่อตารางตรง staging |
| 7. Sequence | ตารางที่มี sequence (ถ้ามี) → `setval(pg_get_serial_sequence('public.mbs_<module>_<t>', '<pk>'), (SELECT max(<pk>) FROM public.mbs_<module>_<t>))` | insert ใหม่ไม่ชน PK |
| 8. Unique/constraint | ตรวจ duplicate ก่อนเพิ่ม unique; ถ้าชน → **หยุดและรายงาน** (ห้าม dedupe เอง) | constraint สร้างได้ |
| 9. Verify | count/checksum ต่อตาราง + สุ่มตรวจ FK + smoke query | ตรง baseline |
| 10. Drop staging | หลัง verify ผ่าน + snapshot แล้ว: `DROP SCHEMA stg_<module> CASCADE;` | ไม่มี schema ค้าง |

> **หมายเหตุ S1:** กรณี rename-in-place (§2.6.2 S1) **ไม่ใช้ staging/import** — staging ทั้งหมดใน §2.6.1 ใช้เฉพาะกรณี S2 (source แยกจาก target)

> **ทำไมยังต้องมี staging:** เพื่อตรวจ row count/FK/unique จากข้อมูล source ก่อนเขียนลงตารางจริง และถ้าตรวจไม่ผ่านสามารถ `DROP SCHEMA stg_<module>` ทิ้งได้โดยไม่ต้อง rollback ข้อมูลในตาราง target

> **ทางเลือก staging แบบ DB แยก:** ถ้า source อยู่คนละ server/DB และ `\copy` ตรงไม่ได้ ให้ restore full dump ลง **staging database** `mbs_stg_<module>` ก่อน แล้วค่อย `\copy` จาก staging DB → `stg_<module>` ใน target DB ตามขั้น 4 (ยังต้องสร้าง staging DDL จาก **ตาราง target prefixed** ตามขั้น 3 และห้ามให้ข้อมูลลงตาราง unprefixed)

##### 2.6.1.1 การเทียบชนิดข้อมูลและ enum mapping (แก้ข้อท้วงรอบ 5–6)

**ปัญหา:** หลังใส่ prefix ชื่อ enum ของ target จะต่างจาก source โดยตั้งใจ (เช่น `Role` → `mbs_<module>_role`) ถ้าเทียบ `udt_name` ตรงๆ จะรายงานว่าไม่ตรงทั้งที่ labels ใช้ร่วมกันได้

**กฎการเทียบ:**

| ชนิด | วิธีเทียบ | ถ้าไม่ตรง |
|---|---|---|
| Built-in types | normalize alias ก่อนเทียบ เช่น `integer`=`int4`, `bigint`=`int8`, `timestamp with time zone`=`timestamptz`, `character varying`=`varchar`; เทียบ normalized type + `is_nullable` | **หยุด รายงาน** พร้อม mapping ที่เสนอ |
| Enum (`data_type='USER-DEFINED'`) | **ห้ามเทียบ `udt_name` ตรงๆ** — ให้เทียบ **labels + ลำดับ** จาก `pg_enum` และจับคู่ชื่อ source enum → target enum | labels/ลำดับไม่ตรง → **หยุด รายงาน** (ห้าม remap ค่า enum เอง) |
| Domain / custom type อื่น | ต้องมี mapping ชัดเจนเป็นรายชนิด | **หยุด รายงาน** |

**Query ตรวจ enum labels (รันทั้ง source และ target):**

```sql
SELECT t.typname,
       array_agg(e.enumlabel ORDER BY e.enumsortorder) AS labels
FROM pg_type t
JOIN pg_enum e ON e.enumtypid = t.oid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
  AND t.typname IN (<รายชื่อ enum ที่เกี่ยวข้อง>)
GROUP BY t.typname;
```

**การโหลดค่า enum (แก้ข้อท้วงรอบ 6):**

- **ฝั่ง source** ส่งออกเป็น text เท่านั้น: `SELECT col::text` — **ห้ามเขียน `col::text::public.mbs_<module>_<enum>`** เพราะชื่อ enum ของ target ไม่มีอยู่ใน source database (คนละ DB) และ cast ข้าม database ทำไม่ได้
- **ฝั่ง target** ไม่ต้อง cast ใน query: staging ถูกสร้างด้วย `LIKE public.mbs_<module>_<t>` (ขั้น 3) จึงมีคอลัมน์ชนิด **enum ของ target อยู่แล้ว** — `\copy ... FROM STDIN` จะแปลง text → enum ของ target ให้เอง
- ขั้น 6 (`INSERT INTO public.mbs_<module>_<t> SELECT ... FROM stg_<module>.<t>`) ไม่ต้อง cast enum เพราะทั้งสองฝั่งเป็นชนิดเดียวกันแล้ว
- ถ้า target ปฏิเสธค่าด้วย `invalid input value for enum ...` แปลว่า label ไม่ตรงกับ mapping ที่อนุมัติ → **หยุด รายงานเจ้าของ** ห้ามแก้/แทนค่าเอง
- ห้าม assume ว่า enum name ตรงกัน — mapping ชื่อ source → target ต้องจดไว้ล่วงหน้าตามตารางด้านบน

**บันทึก mapping:** ต้องจด mapping ตาราง/คอลัมน์/ชนิด (รวมชื่อ enum source → target) ไว้ใน runbook ต่อ module และแนบผลตรวจในรายงาน G1/G1b

**ID/FK mapping:**
- คงค่า ID เดิมทั้งหมด (ไม่ generate ใหม่) เพราะ FK ภายใน module อ้างถึงกัน
- ข้าม module **ไม่มี FK ข้ามกัน** (HANDOFF ห้าม) → ไม่ต้อง remap ID ข้าม module
- ถ้าพบ ID ซ้ำภายในตารางเดียวของ source → เป็นข้อมูลผิดปกติ: **หยุด รายงานเจ้าของ** ห้ามแก้เอง

**Unique constraints:** ตรวจก่อน import ว่าไม่มี duplicate ตาม unique key จริง; ถ้ามี ให้รายงานเป็น finding ไม่ auto-fix

**การตรวจผล (acceptance):** row count ต่อตาราง = source, FK orphan = 0, unique violation = 0, sequence มากกว่า max(id), และ smoke test CRUD ผ่าน

#### 2.6.2 เลือกเส้นทางตามชนิด source (แก้ความขัดกันระหว่าง §2.6 กับ §3.3)

| กรณี source | ใช้วิธี | เหตุผล |
|---|---|---|
| **S1. source DB = DB ที่จะเป็น shared DB และมีข้อมูลของ module เดียว** | **rename-in-place (§3.3)** | ข้อมูลอยู่ในตารางเดิมแล้ว; rename ไม่ย้ายข้อมูล |
| **S2. source DB แยกจาก shared DB** | **import (§2.6.1)** | `ALTER ... RENAME` ข้าม database ไม่ได้ |
| **S3. source DB ถูกใช้ร่วมหลาย module (เช่น local `menu_online`)** | **ห้าม rename/import เป็นค่าเริ่มต้น** | ตาราง unprefixed ชื่อซ้ำ แยก provenance ไม่ได้; ต้องให้เจ้าของยืนยัน (disposable หรือแยกตามหลักฐาน) |
| **S4. source ว่าง/ไม่มีข้อมูล** | สร้าง prefixed schema ด้วย migration (ไม่ import) | ไม่มีข้อมูลให้รักษา |

> **ค่าเริ่มต้นของแผน:** ใช้ **S2 (import)** เพราะ production ของแต่ละ module เป็นคนละ Vercel project/DB; **S1 ใช้ได้เฉพาะ** เมื่อเจ้าของยืนยันว่า DB นั้นจะเป็น shared DB จริงและไม่มีข้อมูล module อื่นปน

> **S1 ไม่ใช้ staging:** rename-in-place ไม่ต้อง export/import — staging ใน §2.6.1 มีไว้สำหรับ S2 เท่านั้น


#### 2.6.3 ปัญหา `_prisma_migrations` ร่วมใน shared DB (ข้อเท็จจริงที่ตรวจพบใหม่)

**ข้อเท็จจริงที่ตรวจในเครื่อง (Prisma 7.10.0):**
- ทุก module ใช้ Prisma migration history ตาราง `_prisma_migrations` **ชื่อเดียวกันใน DB เดียวกัน**
- 4 migration แรกของทั้ง 6 module **เป็นไฟล์ byte-identical** (md5 ตรงกัน): `0_init`, `20260906175746_add_store_settings`, `20260907120000_batch_receipt_number`, `20261107_add_company_id`
- ผลปัจจุบัน: module ที่รันทีหลังจะเห็น `0_init` ถูก apply แล้ว (ชื่อ+checksum ตรง) → **ข้ามการสร้างตารางของตัวเอง** เพราะชื่อตาราง unprefixed ซ้ำกัน — นี่คือสาเหตุที่ provenance ของ local `menu_online` แยกไม่ได้
- `_prisma_migrations` ไม่มี unique constraint บน `migration_name`; จาก G1 Prisma จับคู่ migration ด้วย `migration_name` โดยไม่เทียบ checksum ใน `migrate deploy`/`migrate status` — **ถ้าชื่อซ้ำแต่ SQL ต่าง migration ของโมดูลหลังจะถูกข้ามเงียบ ๆ** โดยไม่สร้าง object ของตน
- ดังนั้นการใส่ prefix ใน SQL อย่างเดียวไม่พอ: **ชื่อ migration folder ต้อง unique ข้ามทุก module** รวม 4 migration แรกที่เคย byte-identical (`0_init`, `20260906175746_add_store_settings`, `20260907120000_batch_receipt_number`, `20261107_add_company_id`)

**ทางเลือก (ต้องเลือกก่อนสร้าง prefixed migration):**

| ทางเลือก | วิธี | ข้อดี | ข้อเสีย |
|---|---|---|---|
| **A. เปลี่ยนชื่อ migration folder ต่อ module** | เช่น `mbs_service_0_init`, `mbs_service_20261107_add_company_id` | history แยกได้ด้วยชื่อ; ไม่ต้องรวม repo | G1 synthetic พบว่า `migrate status` แสดง up to date โดยไม่เตือนเมื่อมี ledger ของโมดูลอื่น; ผลนี้ไม่ใช่ drift check และต้องยืนยันกับ migration จริงใน G1b |
| **B. Consolidated migration history (แนะนำถ้า A ไม่ผ่าน)** | มี migration set เดียว (repo/platform) ที่รวม DDL ทุก module ชื่อไม่ซ้ำ; module ไม่รัน `migrate deploy` เอง | history เดียวสะอาด, ตรวจย้อนหลังง่าย | ผูก release ของ module เข้าด้วยกัน; ต้องมีขั้นตอน review รวม |
| **C. Custom migration runner** | ใช้ `prisma migrate diff --script` แล้วรัน SQL ผ่าน runner ของเรา + ตาราง `mbs_<module>_migrations` เอง | ควบคุมได้เต็ม | ต้องสร้าง tooling เอง; เสี่ยง drift จาก Prisma |

**สิทธิ์ของ migration ledger ต่อทางเลือก (แก้ข้อท้วงข้อ 3):** `_prisma_migrations` เป็นตาราง **unprefixed กลาง** ที่ทุก module ใช้ร่วม — ขัดหลัก "migrator เข้าถึงเฉพาะ object ของตัวเอง" จึงต้องระบุข้อยกเว้นให้ชัด

| ทางเลือก | ใครถือ ledger | สิทธิ์ที่ต้องให้ | หมายเหตุ |
|---|---|---|---|
| **A. Rename folder** | ledger กลาง `_prisma_migrations` | ทุก `mbs_<module>_migrator` ต้องมี `SELECT/INSERT/UPDATE/DELETE` บน `_prisma_migrations` (ข้อยกเว้นเดียวที่ไม่มี prefix) | ต้องจดเป็น documented exception; ห้ามให้ `*_app` เข้าถึง ledger |
| **B. Consolidated** | platform migrator ตัวเดียว | เฉพาะ platform migrator มีสิทธิ์บน ledger; module migrator ไม่มี | least-privilege สะอาดที่สุดในเชิง ledger; แต่ release ผูกกัน |
| **C. Custom runner** | `mbs_<module>_migrations` ต่อ module | migrator ของ module เข้าถึงเฉพาะตาราง ledger ของตัวเอง | isolation ดีที่สุด; ต้องสร้าง tooling |

**สถานะของทางเลือก A:** ผ่านเฉพาะเส้นทางหลักของ synthetic fixture 3 โมดูลใน G1 เมื่อ migration names ไม่ชน, bootstrap ledger ถูกต้อง, grant ครบ และ deploy แบบ serial; **ยังไม่พิสูจน์กับ migration จริงทั้ง 6 โมดูล** และไม่ใช่อนุมัติให้ใช้ production

**Docker test matrix และผล G1 (synthetic fixture):**

| # | สถานการณ์ | ผล |
|---|---|---|
| T1 | clean DB → deploy module A; bootstrap ledger | ผ่าน — ledger สร้างโดย migrator A, 2 rows, objects prefixed |
| T2 | deploy module B ต่อบน ledger ร่วม | ผ่านหลัง grant ledger DML; ก่อน grant ถูกปฏิเสธตามคาด |
| T3 | deploy A+B ซ้ำ | ผ่าน — ไม่มี pending migrations/row ซ้ำ |
| T4 | `migrate status` เมื่อ ledger มีหลายโมดูล | ผ่าน แต่ **ไม่เตือน** applied-but-missing; ห้ามใช้เป็น drift check |
| T5 | app role isolation | ผ่านหลัง explicit DML grants; ถูกปฏิเสธบน ledger และตารางโมดูลอื่น |
| T6 | migrator non-owner ทำ DML บน ledger | ผ่านเมื่อ grant ครบ (ตรวจใน transaction แล้ว rollback) |
| T7 | deploy module C หลัง A+B | ผ่านเมื่อ migration names ไม่ซ้ำ |
| T8 | migration name ซ้ำแต่ checksum/SQL ต่าง | **ไม่ผ่าน:** Prisma ข้ามเงียบ ๆ; migration ไม่ทำงานและ object หาย |
| T9 | ledger มี failed row จากอีกโมดูล | **ไม่ผ่าน:** P3009 บล็อก deploy ทุกโมดูล; การใช้ `migrate resolve --rolled-back` จากอีกโมดูลทดสอบผ่านใน fixture แต่ต้องตรวจ partial DDL และแจ้งผู้รับผิดชอบก่อน |
| T10 | deploy A+B พร้อมกันบน DB ว่าง | **ไม่ผ่าน:** race ตอนสร้าง ledger/สิทธิ์; deploy พร้อมกันไม่ได้ |

**เงื่อนไขบังคับก่อนใช้ทางเลือก A ต่อ:**

1. กำหนดชื่อ migration folder ที่ **unique ทั้งระบบ** โดยใส่ module prefix; ห้ามเปลี่ยนแค่ SQL/checksum
2. Bootstrap ledger แบบ deterministic: deploy โมดูลแรกที่กำหนดไว้ให้สร้าง `_prisma_migrations`, grant `SELECT/INSERT/UPDATE/DELETE` ให้ migrator ของโมดูลที่เหลือ แล้ว deploy ทีละโมดูล ห้าม parallel deploy
3. Migration failure ต้องหยุด rollout ทุกโมดูล, เก็บ error/ตรวจ partial DDL และแจ้งผู้รับผิดชอบก่อนแก้สถานะ ledger; `migrate resolve --rolled-back <name>` ใช้ได้ใน fixture จาก migrator อื่นที่มีสิทธิ์ แต่ห้าม resolve โดยอัตโนมัติหรือก่อนตรวจผลกระทบ
4. `*_app` ต้องได้รับ DML grants แบบระบุเฉพาะตารางของโมดูลตนเอง; ownership ของ migrator ไม่ให้สิทธิ์ runtime โดยอัตโนมัติ และห้ามใช้ grant กว้างข้ามโมดูล

> **ข้อจำกัดผล G1:** ทดสอบด้วย synthetic fixture 3 โมดูล, PostgreSQL 16.15 และ Prisma 7.10.0 เท่านั้น ไม่ได้พิสูจน์ migrations จริงของ 6 โมดูล, data import, schema drift, Neon หรือ production PostgreSQL version. ก่อน G1b ต้องทำ migration names/runbook ให้ unique และมีวิธี bootstrap/failure recovery ที่ review แล้ว

> **ข้อสรุป:** งานนี้ต้องมี "source inventory per module" เป็น gate แยกก่อนสร้าง migration จริง — ถ้า production source ไม่ว่างและยังไม่ inventory ครบ ห้าม proceed

---

## 3. แผนรักษาข้อมูลเดิม (Non-destructive)

### 3.1 หลักการ

1. **ไม่ rename/drop/overwrite แบบ blind** — ต้อง inventory source จริงก่อนทุกครั้ง
2. ใช้ **import (§2.6.1)** เป็นค่าเริ่มต้นเมื่อ source เป็น DB แยก; ใช้ **rename-in-place** เฉพาะกรณี S1 (§2.6.2) ที่ source เป็น DB ปลายทางและมีข้อมูล module เดียว
3. ใช้ **transactional DDL** ของ PostgreSQL (BEGIN … COMMIT ต่อ module)
4. **Backup/snapshot ก่อนทุก DDL** และเก็บ rollback script คู่กับ migration
5. ไม่แตะตาราง Core (`public` unprefixed ของ Core) — integration ผ่าน Bridge API เท่านั้น

### 3.2 Pre-flight checks (read-only ก่อน migration)

รันกับ source จริง (Docker/Neon branch) ก่อนเสมอ:

```sql
-- 1) ตรวจ object ที่มีอยู่จริง (กันชื่อชน)
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY 1;
SELECT typname FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public' AND t.typtype = 'e' ORDER BY 1;

-- 2) นับแถวต่อตาราง (บันทึกเป็น baseline)
SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY relname;

-- 3) ตรวจ NULL company_id (ต้องตัดสินก่อน remap)
SELECT 'users' AS t, count(*) FROM users WHERE company_id IS NULL
UNION ALL SELECT 'orders', count(*) FROM orders WHERE company_id IS NULL;

-- 4) ตรวจ orphan FK / ค่า enum ที่อยู่นอกลิสต์
-- 5) ตรวจความยาว identifier ≤ 63 bytes สำหรับชื่อ prefixed ใหม่
```

### 3.3 กลยุทธ์ migration — rename-in-place (เฉพาะกรณี S1 เท่านั้น)

ลำดับต่อ module (ใน transaction เดียว):

```sql
BEGIN;
-- 1) enum
ALTER TYPE "Role" RENAME TO mbs_<module>_role;
ALTER TYPE "OrderStatus" RENAME TO mbs_<module>_order_status;
ALTER TYPE "OrderSource" RENAME TO mbs_<module>_order_source;
ALTER TYPE "ItemStatus" RENAME TO mbs_<module>_item_status;
ALTER TYPE "PaymentMethod" RENAME TO mbs_<module>_payment_method;

-- 2) ตาราง
ALTER TABLE "users" RENAME TO mbs_<module>_users;
ALTER TABLE "categories" RENAME TO mbs_<module>_categories;
-- ... ครบทุกตาราง

-- 3) index / unique constraint / relation constraint ที่ตั้งชื่อไว้
ALTER INDEX "users_company_idx" RENAME TO mbs_<module>_users_company_idx;
-- ... ครบทุกตัว

COMMIT;
```

**Option B (สำรอง)** — เฉพาะกรณีชื่อชนกับ object อื่น: `CREATE TABLE ... AS SELECT` / `INSERT INTO ... SELECT` แล้ว swap แบบมี backup; ต้องขออนุมัติแยกก่อนใช้

**ข้อจำกัดสำคัญ (แก้ข้อท้วงข้อ 2):** rename-in-place ใช้ได้เฉพาะกรณี **S1** ใน §2.6.2 — source DB ต้องเป็น DB ที่จะเป็น shared DB และมีข้อมูลของ module เดียวเท่านั้น

| สถานการณ์ | ใช้ rename-in-place ได้? |
|---|---|
| source = target shared DB, มีข้อมูล module เดียว | ✅ ได้ |
| source เป็น DB แยก | ❌ ไม่ได้ — `ALTER ... RENAME` ข้าม database ไม่ได้ → ใช้ import §2.6.1 |
| source DB ถูกใช้ร่วมหลาย module (ตาราง unprefixed ชื่อซ้ำ) | ❌ ห้าม — แยก provenance ไม่ได้ → รอเจ้าของยืนยัน (§2.6.2 S3) |

> **ค่าเริ่มต้น:** production ของแต่ละ module เป็นคนละ DB → ใช้ **import (§2.6.1)**; rename-in-place เป็นกรณียกเว้นที่ต้องมีหลักฐานยืนยันว่าเป็น S1

### 3.4 การจัดการ `company_id = '1'`

| กรณี | แนวทาง |
|---|---|
| production mapping ของ module = company `1` (`Your Company`) | คงค่า `'1'` ไว้ ไม่ต้องแก้ข้อมูล |
| production mapping = company `2` (`innovation`) หรือ `3` (`บริษัท ทดสอบ จำกัด`) | ต้องมี **คำสั่งอนุมัติชัดจากเจ้าของ** แล้วรัน `UPDATE ... SET company_id = '<target>' WHERE company_id = '1'` แบบมี backup + inverse script |
| พบ `company_id IS NULL` | **ห้ามเดา** — รายงานจำนวน/ตารางให้เจ้าของตัดสิน; ค่าเริ่มต้นคือคง NULL ไว้จนมีคำสั่ง (หรือ backfill `'1'` เฉพาะเมื่อเจ้าของอนุมัติ) |
| `store_settings` / `prescription_items` ไม่มี companyId | ไม่ต้อง remap ค่า company ในตารางเหล่านี้; การเพิ่ม tenant key ของ `store_settings` และ isolation ของ `prescription_items` อยู่ใน §3.7 (migration แยกที่ต้องอนุมัติ) |

> ค่า `MBS_COMPANY_ID` ใน `.env` local = `1` เป็นเพียงค่า dev — **ไม่ใช่ production mapping** และห้ามใช้เป็นค่าตั้งต้นใน production

### 3.5 Backup plan

- **ก่อน DDL:** สร้าง Neon branch snapshot (กรณี production-like) หรือ `pg_dump --format=custom` (กรณี Docker) + บันทึก row count baseline
- เก็บ rollback SQL ไว้ในโฟลเดอร์ migration/แผน (ยังไม่รัน)
- ตรวจว่า restore ได้จริงใน Docker/Neon branch ก่อนใช้ production

### 3.6 บัญชีผู้ใช้และ Auth — ไม่มี SSO (ปิดข้อท้วงข้อ 2)

**สถานะที่เจ้าของยืนยัน (2026-11-09):** ระบบ **ไม่ใช้ SSO** และไม่มี cross-site login. Core และโมดูลทั้งหกใช้ฐานข้อมูล PostgreSQL ชุดเดียวกัน (Neon = Dev, Supabase = Production) แต่แต่ละแอปล็อกอินและออก session cookie ของตัวเอง

**ข้อเท็จจริงปัจจุบัน:**

- แต่ละ module มีตาราง `users` ที่มี prefix ของตัวเองใน shared DB + `SESSION_SECRET` ของตัวเอง
- `lib/auth/session.ts` เซ็น JWT แบบ **HS256 ด้วย secret ต่อ module**, cookie ชื่อ `session`, payload มี `userId`, `role`, `companyId`
- `lib/auth/rbac.ts` อ่าน role จากแถว `users` ในตารางของ module ตัวเองตาม `session.userId`
- Core มีระบบ auth/ผู้ใช้ของตัวเอง
- คอลัมน์ `core_user_id` ในตาราง users ของ module ยังคงอยู่เป็นข้อมูลเดิม แต่ไม่มี flow ใดอ่าน/เขียนแล้ว

**ผลต่อแผน shared DB:**

1. ไม่ต้องรวมตาราง `users`, ไม่ต้องสร้าง JWKS/token exchange และไม่ต้องแก้ `session.ts`/`rbac.ts` เพื่อ SSO
2. งานที่เหลือคือ tenant isolation (`company_id`), สิทธิ์ DB ตาม §4 และการทดสอบ login ของแต่ละแอป
3. ห้ามเพิ่ม SSO/token ข้ามแอปกลับเข้ามาโดยไม่ได้รับคำสั่งจากเจ้าของ

### 3.7 Tenant scope ที่ยังขาด — ปิดข้อท้วงข้อ 3

**`store_settings` (ทุก module) — ปัจจุบันไม่มี tenant key:**

- Schema: `key String @id`, `value Json` — **ตารางเดียวต่อ module**, ไม่มี `companyId`
- โค้ด Service `app/api/settings/route.ts` ใช้ `storeSetting.findMany()` **ไม่กรอง company** → ถ้า shared DB มีหลายบริษัท ค่าตั้งค่าจะปะปนกัน (แม้ปัจจุบันจะใช้ key `storeName:<companyId>` เป็นการชั่วคราว แต่ยังอ่าน row ของบริษัทอื่นเข้ามาในหน่วยความจำ)
- **ข้อเสนอ:** เพิ่ม `company_id TEXT NOT NULL` + เปลี่ยน PK เป็น `(company_id, key)`; แก้ query เป็น `where: { companyId }`
- **ผลกระทบ:** เป็น migration แยก (additive + backfill) — ต้องอนุมัติก่อน; ระหว่างนี้ห้ามใช้ shared DB กับหลายบริษัท
- **หลักฐานที่ต้องมีก่อน backfill (ตอบข้อท้วงข้อ 6):** ต้อง **inventory key จริง** จาก source/target ที่จะย้าย (เช่น `SELECT DISTINCT key FROM store_settings`) และรายงานผลก่อนออกแบบ backfill
  - ห้ามสรุปว่าทุก key เป็นรูปแบบ `storeName:<companyId>` จากโค้ดเพียงอย่างเดียว
  - ต้องแยกให้ได้ว่า key ใดเป็น global (เช่น `storeName`) และ key ใดเป็น per-company; ถ้าแยกไม่ได้ → **หยุด รายงานเจ้าของ** ห้ามเดา
  - ถ้าไม่มีข้อมูลจริง (ตารางว่าง) → สร้าง PK ใหม่ `(company_id, key)` ได้เลยโดยไม่ต้อง backfill
  - ค่า default (`DEFAULTS.storeName`) ไม่ใช่ข้อมูลจริง — ห้ามใช้แทนการ inventory

**`prescription_items` (Pharmacy) — ไม่มี `companyId` โดยตั้งใจ:**

- Schema: `PrescriptionItem` ผูกกับ `Prescription` (ซึ่งมี `companyId`) ผ่าน FK — ไม่มี `companyId` ของตัวเอง
- โค้ด `app/api/prescriptions/route.ts` กรองที่ parent: `prisma.prescription.findMany({ where: { companyId }, include: { items: ... } })` → isolation ผ่าน parent relation ✅
- **ข้อกำหนดบังคับ:** ทุก query ที่แตะ `prescription_items` ต้องผ่าน parent `prescription` ที่กรอง `companyId` แล้ว **ห้าม query `prescriptionItem` ตรงๆ แบบไม่มี parent filter**
- **ข้อเสนอ:** เพิ่ม regression test ที่ยืนยันว่า query item ตรงๆ ถูกบล็อก/ไม่มี endpoint ที่ทำได้ + ตรวจ code review ทุกครั้ง; ไม่ต้องเพิ่ม `companyId` ซ้ำ (denormalize) เว้นแต่เจ้าของต้องการ

> **สรุป:** `store_settings` ต้องเพิ่ม tenant key (migration แยก), `prescription_items` ใช้ parent-relation isolation + regression test — ทั้งสองข้อต้องปิดก่อนใช้ shared DB กับหลายบริษัท

---

## 4. DB Roles & Grants (Least Privilege)

### 4.1 ชื่อ role ที่เสนอ (ต่อ module)

| Module | Runtime role (Vercel `DATABASE_URL`) | Migration role (`DIRECT_URL`, ใช้เฉพาะ CI/local) |
|---|---|---|
| Service | `mbs_service_app` | `mbs_service_migrator` |
| Retail | `mbs_retail_app` | `mbs_retail_migrator` |
| Rental | `mbs_rental_app` | `mbs_rental_migrator` |
| Pharmacy | `mbs_pharmacy_app` | `mbs_pharmacy_migrator` |
| Hotel | `mbs_hotel_app` | `mbs_hotel_migrator` |
| F&B | `mbs_fnb_app` | `mbs_fnb_migrator` |

### 4.2 สิทธิ์ที่แต่ละ role ต้องใช้

| สิทธิ์ | Runtime (`*_app`) | Migration (`*_migrator`) |
|---|---|---|
| CONNECT database | ✅ | ✅ |
| USAGE schema `public` | ✅ | ✅ |
| CREATE บน schema `public` | ❌ | ✅ — **แต่จำกัดชื่อไม่ได้** (ดู §4.4) |
| SELECT / INSERT / UPDATE / DELETE บนตาราง prefixed ของ module | ✅ | ✅ |
| USAGE บน enum prefixed ของ module | ✅ | ✅ |
| USAGE/SELECT บน sequence ของ module (ถ้ามี) | ✅ | ✅ |
| ALTER / DROP object ของ module | ❌ | ✅ (เจ้าของ object) |
| `_prisma_migrations` (ledger กลาง) | ❌ | ขึ้นกับทางเลือก §2.6.3: A = ทุก migrator มี DML บน ledger (ข้อยกเว้น); B = เฉพาะ platform migrator; C = ใช้ ledger ของตัวเอง |
| เข้าถึงตาราง Core หรือ module อื่น | ❌ | ❌ |
| อยู่ใน Vercel Production | ✅ (pooled) | ❌ **ห้าม** |

### 4.3 แนวทาง grant

```sql
-- runtime: explicit ต่อ object (ไม่ใช้ ON ALL TABLES แบบกว้าง)
GRANT SELECT, INSERT, UPDATE, DELETE ON
  mbs_service_users, mbs_service_categories, mbs_service_products,
  mbs_service_tables, mbs_service_orders, mbs_service_order_items,
  mbs_service_payments, mbs_service_store_settings, mbs_service_bookings
TO mbs_service_app;

GRANT USAGE ON TYPE
  mbs_service_role, mbs_service_order_status, mbs_service_order_source,
  mbs_service_item_status, mbs_service_payment_method
TO mbs_service_app;

-- default privileges สำหรับ object ใหม่ในอนาคต (เจ้าของ object = migrator)
ALTER DEFAULT PRIVILEGES FOR ROLE mbs_service_migrator IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO mbs_service_app;
ALTER DEFAULT PRIVILEGES FOR ROLE mbs_service_migrator IN SCHEMA public
  GRANT USAGE ON TYPES TO mbs_service_app;
```

**ข้อควรระวัง:**
- ตรวจ PostgreSQL version ก่อนตัดสิน `REVOKE CREATE ON SCHEMA public FROM PUBLIC` (PG15+ revoke ให้อยู่แล้ว)
- ชื่อ object/constraint ต้อง ≤ 63 bytes — ตรวจทุกชื่อ prefixed ก่อนสร้าง
- migration role ยังต้องมี `CREATE` บน `public` (ข้อจำกัดของการใช้ public + prefix) — บรรเทาด้วยกระบวนการ review + ownership + prefix; ระบุเป็น residual risk ให้เจ้าของรับทราบ
- รหัสผ่าน role เก็บใน Vercel/secret manager เท่านั้น ห้าม commit หรือพิมพ์ในรายงาน

### 4.4 Ownership + ข้อจำกัด `CREATE` ของ migrator — ปิดข้อท้วงข้อ 4

**ข้อเท็จจริง:** PostgreSQL **ไม่มีความสามารถ grant ให้สร้างได้เฉพาะชื่อที่มี prefix** — `GRANT CREATE ON SCHEMA public` อนุญาตให้สร้าง object ชื่ออะไรก็ได้ใน schema นั้น ดังนั้นตารางสรุป §4.2 ที่เขียนว่า "CREATE เฉพาะ object ของ module" **สื่อได้ไม่ตรงกับสิ่งที่ grant ทำได้จริง**

**แนวทางบังคับ (public + prefix):**

1. **Ownership:** object ทุกตัวของ module ต้องมี owner = `mbs_<module>_migrator` (สร้าง/rename ภายใต้ role นี้) → runtime `*_app` ไม่มีสิทธิ์ DDL และไม่ใช่ owner
2. **Rename ของ object เดิม:** object เดิม (สร้างโดย `postgres`/role อื่น) ต้อง **โอน ownership ก่อน** ด้วย `ALTER TABLE ... OWNER TO mbs_<module>_migrator;` (และ `ALTER TYPE ... OWNER TO ...`) ภายใต้ superuser/owner เดิม — ถ้าไม่โอน migrator จะ rename/alter ไม่ได้
3. **Runtime ไม่มี DDL:** `mbs_<module>_app` ได้เฉพาะ DML + USAGE type; ไม่มี `CREATE`, ไม่มี ownership
4. **Migrator ไม่อยู่ใน Vercel Production:** ใช้เฉพาะ CI/local/direct URL
5. **ตรวจหลัง rename:** query `pg_class`/`pg_type` ยืนยัน owner ของทุก prefixed object = `mbs_<module>_migrator`

**Residual risk ที่ต้องรับทราบ:** แม้จำกัดด้วย ownership + process review + prefix แล้ว `*_migrator` ยัง **สามารถสร้าง object ชื่อใดก็ได้ใน `public`** (ไม่ใช่แค่ prefixed) — เป็นข้อจำกัดของสถาปัตยกรรม public + prefix

**Namespace ที่เป็นข้อกำหนดแล้ว (ตอบข้อท้วงข้อ 4):**

- `docs/HANDOFF.md` §13 ระบุชัด: **"Keep module tables in PostgreSQL `public` and assign each module a unique physical prefix"** — เลือก public + prefix แล้วเพื่อเลี่ยง `search_path`/Prisma multi-schema
- แผนนี้จึง **ไม่เสนอ schema-per-module เป็นทางเลือกเปิด**; ถ้าจะเปลี่ยนเป็น schema-per-module ต้อง **แก้ HANDOFF §13 ก่อน** และได้รับอนุมัติแยก
- residual `CREATE` risk ข้างต้นถูกยอมรับภายใต้เงื่อนไข: ownership = migrator, review ทุก migration, และ Docker rehearsal พิสูจน์ว่า role เข้าถึงได้เฉพาะ object ของตัวเอง
- **สิ่งที่ต้องพิสูจน์ใน Docker:** หลัง rename แล้ว `mbs_<module>_app` (1) อ่าน/เขียน object ของ module ตัวเองได้ (2) อ่าน/เขียน Core หรือ module อื่นไม่ได้ (3) ไม่มีสิทธิ์ DDL

---

## 5. แผน Rollback

### 5.1 Rollback ต่อขั้นตอน

| ขั้นตอน | Rollback |
|---|---|
| Backup/snapshot | ไม่ต้อง (เป็นจุดพัก) |
| Rename enum | `ALTER TYPE mbs_<module>_role RENAME TO "Role";` (ย้อนกลับชื่อเดิม) |
| Rename ตาราง | `ALTER TABLE mbs_<module>_users RENAME TO "users";` |
| Rename index/constraint | `ALTER INDEX mbs_<module>_users_company_idx RENAME TO users_company_idx;` |
| Grant roles | `REVOKE ... FROM mbs_<module>_app;` แล้ว `DROP OWNED BY` / `DROP ROLE` (หลังโอน ownership) |
| company_id remap | **snapshot/restore เป็นหลัก**; ถ้าต้อง inverse ให้ย้อนเฉพาะแถวที่บันทึกใน journal (ดู §5.4) — **ห้าม** `UPDATE ... WHERE company_id = '<target>'` แบบเหมารวม |
| ผิดพลาดกลางทาง | `ROLLBACK;` (transactional DDL) แล้ว restore snapshot ถ้าจำเป็น |

### 5.2 Full restore

1. หยุด write traffic ของ module นั้น (maintenance/feature flag)
2. Restore จาก Neon branch snapshot หรือ `pg_dump` ที่บันทึกไว้
3. ตรวจ row count / checksum เทียบ baseline
4. รัน smoke test (health, login, representative CRUD) + `prisma migrate status`
5. บันทึกผลใน `docs/DECISIONS.md`

### 5.3 เงื่อนไขที่ต้อง rollback ทันที (triggers)

- พบ duplicate object / ชื่อชนหลัง rename
- row count ไม่ตรง baseline
- module role เข้าถึงตาราง Core/module อื่นได้
- typecheck/lint/build หรือ focused tests ล้มเหลวหลัง migration
- พบข้อมูล production ที่ไม่คาดคิด (เช่น มีแถวมากกว่าที่ inventory ไว้)

### 5.4 Company ID remap journal — ปิดข้อท้วงข้อ 5

**ปัญหา:** คำสั่งย้อน `UPDATE ... SET company_id = '1' WHERE company_id = '<target>'` จะ **เปลี่ยนแถวที่ตั้งใจให้เป็น target อยู่ก่อนแล้ว** ด้วย (over-revert) เพราะแก้ไม่ได้แยกว่าจากเดิม

**ข้อกำหนดบังคับ:**

1. **Snapshot/restore เป็นวิธี rollback หลัก** — ไม่ใช้ inverse UPDATE เป็นทางหลัก
2. ถ้าจำเป็นต้อง inverse ให้สร้าง **journal table** ก่อน remap:

```sql
CREATE TABLE mbs_<module>_company_remap_log (
  id            bigserial PRIMARY KEY,
  table_name    text        NOT NULL,
  row_pk        text        NOT NULL,
  old_company_id text,
  new_company_id text,
  remapped_at   timestamptz NOT NULL DEFAULT now(),
  batch_id      uuid        NOT NULL,
  UNIQUE (batch_id, table_name, row_pk)
);
```

3. Remap ทำใน transaction เดียวต่อ module + `batch_id` เดียว:
   - `INSERT INTO ..._remap_log SELECT ... FROM <table> WHERE company_id = '<from>'` **ก่อน** UPDATE
   - แล้ว `UPDATE ... SET company_id = '<target>' WHERE company_id = '<from>'`
   - commit พร้อมกัน (journal + data)
4. Inverse = `UPDATE <table> t SET company_id = l.old_company_id FROM ..._remap_log l WHERE l.batch_id = '<batch>' AND t.<pk> = l.row_pk` → ย้อน **เฉพาะแถวที่บันทึกไว้**
5. ตรวจผล: count(journal) ต้องเท่ากับ count(rows ที่เปลี่ยน) และเท่ากับผลต่าง baseline

> **ห้าม:** รัน inverse UPDATE แบบเหมารวมโดยไม่มี journal หรือ snapshot — ถ้าไม่มีหลักฐานแถวที่เปลี่ยน ให้ restore snapshot เท่านั้น

---

## 6. คำถามที่ต้องให้เจ้าของยืนยัน (แยกตาม gate)

### 6.1 คำยืนยันสำหรับ Docker rehearsal (ปิดได้ด้วย fixture — ไม่ต้องใช้ production data)

| # | คำถาม | คำตอบ/สถานะ G1 |
|---|---|---|
| D1 | ยืนยัน namespace = public + prefix ตาม HANDOFF §13 (ไม่เปลี่ยนเป็น schema-per-module) | ยืนยันสำหรับ G1 |
| D2 | ชื่อ role `mbs_<module>_app` / `mbs_<module>_migrator` | ยืนยันสำหรับ G1 |
| D3 | แนวทาง migration history: A (rename folder ต่อ module) / B (consolidated) / C (custom runner) — §2.6.3 | ทดลอง A เท่านั้น; หากไม่ผ่านให้หยุดและรายงาน |
| D4 | อนุมัติสร้าง Docker container/DB ชื่อ `mbs-shared-modules-test-pg` / `mbs_shared_modules_test` (disposable) | อนุมัติและทดสอบแล้ว; container ถูกลบหลังทดสอบ, anonymous volume ยังอยู่ |
| D5 | อนุญาตให้ใช้ fixture (ไม่ใช่ข้อมูลจริง) ในการทดสอบ CRUD/Bridge | อนุมัติและใช้ synthetic fixtures แล้ว |
| D6 | G1 จะพิสูจน์ migration ledger A/B/C ด้วย **synthetic fixture migration set** (ชื่อ/โครงเดียวของจริง แต่ตารางน้อย) หรือ prefixed migration จริงของทั้ง 6 module | ใช้ synthetic fixture 3 โมดูล; ไม่ใช่ migration จริงทั้ง 6 |

> G1 ใช้ PostgreSQL 16.15 + Prisma CLI 7.10.0, synthetic modules 3 ชุด และ 5 migrations; **ไม่ใช้ production data**. ผลตาม §2.6.3 และ `/tmp/opencode/g1-synthetic/RESULTS.md`.

> **หมายเหตุ:** ถ้าเลือก synthetic fixture ใน D6 จะต้องมี **G1b** (Docker rehearsal ด้วย prefixed migration จริง) หลัง implement schema prefix และได้รับอนุมัติ ก่อนไป G2

### 6.2 ต้องตอบก่อน Neon disposable-branch rehearsal

> **ข้อเท็จจริงเรื่อง Neon branch (แก้ข้อท้วงรอบ 3–4):** Neon branch **สืบทอดข้อมูลจาก parent** แบบ copy-on-write — branch ที่สร้างจาก production จะ **ไม่ว่าง** โดยอัตโนมัติ
>
> **`DROP SCHEMA public CASCADE` เป็นการลบกว้าง:** ลบทุก object ใน schema `public` รวมถึง extension ที่ติดตั้งไว้ใน schema นั้น และต้อง recreate schema + grants ใหม่ — ใช้เฉพาะเมื่อยืนยันได้ว่าเป็น branch ที่ทิ้งได้จริงและมี backup branch แล้วเท่านั้น

**ลำดับความปลอดภัยของ target rehearsal (เลือกจากบนลงล่าง):**

| ลำดับ | วิธี | หมายเหตุ |
|---|---|---|
| 1 (แนะนำ) | **Neon project ใหม่ (ว่าง)** | ไม่มีข้อมูล production ใดๆ มาเกี่ยวข้อง |
| 2 | branch disposable + `CREATE DATABASE mbs_rehearsal` ใน branch นั้น แล้ว `DROP DATABASE mbs_rehearsal` หลังเสร็จ | ไม่แตะ schema `public` ของ branch; ต้องมีสิทธิ์สร้าง DB |
| 3 (เสี่ยงสุด) | `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` บน branch disposable | ต้องจดรายการ object/extension ก่อนลบ, มี backup branch, และยืนยันว่าไม่มีใครใช้ branch นี้ |

| # | คำถาม |
|---|---|
| N1 | อนุมัติใช้ **Neon project ใหม่ (ว่าง)** หรือ branch ที่มี **parent ว่าง** สำหรับ rehearsal — ไม่ใช่ branch ของ production |
| N2 | ถ้าจำเป็นต้องใช้ branch จาก parent ที่มีข้อมูล: เลือกวิธี (1) สร้าง DB ใหม่ `mbs_rehearsal` ใน branch (แนะนำ) หรือ (2) `DROP SCHEMA public CASCADE` เฉพาะ branch ที่ยืนยันว่า disposable + มี backup branch |
| N3 | ผู้ให้ direct (non-pooled) URL ของ project/branch/DB นั้น โดยไม่เปิดเผยในรายงาน |
| N4 | ยืนยันว่าจะไม่ชี้ target นี้ไปที่ production data และจะไม่แตะ production branch |

### 6.3 ต้องตอบก่อน Production migration/deploy (ยังไม่ใช่ตอนนี้)

| # | คำถาม |
|---|---|
| P1 | Production source DB ของแต่ละ module อยู่ที่ใด (อ่าน metadata แบบ read-only เมื่ออนุมัติแยก) |
| P2 | production มีข้อมูลจริงหรือไม่ + row count ต่อตาราง |
| P3 | production `MBS_COMPANY_ID` ของแต่ละ module = 1 / 2 / 3 หรือค่าอื่น |
| P4 | ข้อมูลเดิม `company_id='1'` คงไว้หรือ remap |
| P5 | มีข้อมูลลูกค้าจริงที่ต้องรักษาเป็นพิเศษนอกเหนือ 3 sample companies หรือไม่ |
| P6 | ยืนยัน `store_settings` key inventory (§3.7) ก่อนออกแบบ backfill |
| P7 | ยืนยัน rollback = snapshot เป็นหลัก + journal table (§5.4) |

### 6.4 Auth — ยืนยันแล้ว (ไม่มีคำถามค้าง)

เจ้าของยืนยัน 2026-11-09: ใช้ **auth แยกต่อแอป ไม่มี SSO** และไม่มี shared token ข้ามโดเมน งาน auth ที่เหลือคือ tenant isolation และการทดสอบ login/สิทธิ์ของแต่ละแอปเท่านั้น

---

## 7. ลำดับถัดไป (gate map ตาม HANDOFF §13 required sequence)

| Gate | งาน | ต้องมีก่อน | ยังไม่ต้องมี |
|---|---|---|---|
| G0 | อนุมัติ Revision 8 + ตอบ §6.1 | เจ้าของ | production data |
| G1 | Docker rehearsal (disposable container/DB) — synthetic fixture | **เสร็จ 2026-11-08; ทาง A ผ่านเฉพาะเส้นทางหลักภายใต้เงื่อนไข §2.6.3** | Vercel, production URL |
| G1b | Docker rehearsal ด้วย prefixed migration จริง | **ผ่าน 2026-11-08** (docs/G1B_RESULTS.md) | Vercel, production URL |
| G2 | Neon rehearsal | **ผ่าน 2026-11-08** (docs/G2_RESULTS.md) | production data |
| G3 | Production source inventory (read-only) | G2 ผ่าน + อนุมัติแยก | env change |
| G4 | env checklist + env change + deploy/migration | G3 ผ่าน + อนุมัติแยก | — |

**การอนุมัติแยกส่วน (สำคัญ — อนุมัติเอกสาร ≠ อนุมัติสร้าง/รันฐานทดสอบ):**

| สิ่งที่อนุมัติ | ครอบคลุม | **ไม่ครอบคลุม** |
|---|---|---|
| **อนุมัติเอกสาร (G0)** | รับรอง Revision 8 ว่าใช้เป็นแผนได้ | ไม่ได้อนุมัติ migration จริง, Neon, env, deploy |
| **อนุมัติ G1 execution (D4/D5/D6)** | สร้าง container/DB disposable + ใช้ fixture + รัน synthetic migration เพื่อพิสูจน์ ledger | ไม่ได้อนุมัติ schema prefix จริง, G1b, G2, production |
| **อนุมัติ implement schema prefix (ก่อน G1b)** | แก้ prefixed migration/schema ใน repo | ไม่ได้อนุมัติ Neon/production/env/deploy |
| **อนุมัติ G2 (N1–N4)** | สร้าง/ใช้ Neon project หรือ branch disposable | ไม่ได้อนุมัติ production source/env |
| **อนุมัติ G3 (P1–P7)** | อ่าน metadata production แบบ read-only | ไม่ได้อนุมัติแก้ env/deploy |

**หมายเหตุ:** G1/G1b/G2 ใช้ fixture/empty DB เท่านั้น; **ห้ามถือว่า Neon branch ว่าง** — ลำดับแนะนำคือ project ใหม่/parent ว่าง, รองลงมาคือ DB ใหม่ใน branch disposable, และ `DROP SCHEMA public CASCADE` เป็นทางเลือกสุดท้ายเฉพาะ branch ที่ยืนยัน disposable + มี backup; G3 เป็น read-only metadata inspection แยกจาก Vercel env change โดยสิ้นเชิง (HANDOFF §13 step 7: "Do not request Vercel access before these acceptance criteria pass")

> **งาน implement ที่ยังไม่เริ่ม:** `.env.example` (เลิก `MBS_COMPANY_ID=1`), `prisma.config.ts` (`DIRECT_URL`), schema prefix และ migration names ที่ unique ต่อ module — ต้องผ่าน G1b แยกก่อน G2; SSO ถูกถอดออกแล้ว (ดู §3.6) ไม่มีงาน SSO ค้างในแผนนี้
