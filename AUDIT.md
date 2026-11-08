# Source Audit — Micro-Business-Suite (Core)

**วันที่ตรวจ:** 2026-11-08  
**ขอบเขต:** static review ของ source, เอกสาร, scripts และ local automated checks  
**ผลทดสอบ Production:** ไม่ได้ทดสอบและไม่สามารถยืนยันสถานะ Production จากการตรวจนี้ได้

## สรุป

Core มี integration tests สำหรับตรวจ authorization และ tenant boundaries แต่การทดสอบเหล่านั้นต้องใช้ test URL, database และ JWT test secret ซึ่งไม่ได้ตั้งค่าใน session นี้ จึงถูก skip ตาม safety guard ของ test เอง ไม่ได้ทดสอบ SSO/API แบบ end-to-end

## ประเด็นที่พบ

| ระดับ | ประเด็น | หลักฐานจาก source | ข้อเสนอแนะ |
|---|---|---|---|
| สูง | API ออก SSO token รับ audience จาก request โดยตรวจเพียงว่ามีค่า และลงลายเซ็นตามค่านั้น ขณะที่หน้า login รับ redirect จาก URL แล้วแนบ token ใน query string | [app/api/auth/sso-token/route.ts](./app/api/auth/sso-token/route.ts), [app/login/page.tsx](./app/login/page.tsx) | จำกัด audience ด้วย allowlist ที่ฝั่ง Core และ callback ด้วยรายชื่อ URL ของโมดูล; เพิ่ม test ปฏิเสธ audience/callback ที่ไม่รู้จัก |
| กลาง | Legacy integrations webhook สร้าง invoice จาก payload โดยไม่เห็น idempotency key หรือการตรวจ event ซ้ำใน route; การส่งซ้ำที่ผ่าน auth อาจสร้างรายการซ้ำ | [app/api/integrations/webhook/route.ts](./app/api/integrations/webhook/route.ts) | กำหนด event ID/idempotency และทดสอบ replay; แยกการใช้งานจาก Bridge endpoint ตามเอกสาร |
| กลาง | helper ฝั่ง auth ใช้บริษัทแรกเป็นค่า fallback เมื่อไม่พบ company mapping และมีเส้นทางสร้างบริษัทเมื่อไม่พบข้อมูลบริษัท | [lib/auth.ts](./lib/auth.ts) | กำหนดนโยบายสำหรับ user ที่ไม่มี company mapping ให้ชัด และทดสอบกรณีไม่มี/ไม่ถูกต้องแทนการเลือก tenant เริ่มต้นโดยอัตโนมัติ |

## ผลการตรวจ

- `pnpm test`: ผ่าน 23 tests, ล้มเหลว 0; ข้าม 9 integration security tests เพราะไม่มี `MBS_TEST_BASE_URL`, `MBS_TEST_DATABASE_URL`, `MBS_TEST_JWT_SECRET`
- `pnpm lint`: จบโดยไม่มี lint errors แต่มี 335 warnings
- `pnpm build`: Next.js compile สำเร็จ
- ไม่อ่านค่า secret จาก `.env*`, ไม่เชื่อมฐานข้อมูล, ไม่ล็อกอิน และไม่เรียก Production

## ข้อจำกัดและสิ่งที่ยังไม่ยืนยัน

- ไม่มี E2E run; การเปิดใช้งาน integration tests ต้องยืนยัน disposable test database และ local/test app ก่อน ห้ามใช้ Production
- ไม่ได้ตรวจ runtime configuration, Vercel logs หรือผล SSO/API จริง
- พบไฟล์งานเดิมที่ยังไม่ commit/untracked ใน worktree ก่อนเพิ่มรายงานนี้; ไม่ได้แก้ไขหรือลบไฟล์เหล่านั้น
