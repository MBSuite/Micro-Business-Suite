import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const route = readFileSync(join(ROOT, "app/api/bridge/admin-license/route.ts"), "utf8");
const envExample = readFileSync(join(ROOT, ".env.example"), "utf8");
const proxy = readFileSync(join(ROOT, "proxy.ts"), "utf8");

test("Admin license bridge ใช้ token เฉพาะงาน (ไม่ใช้ MBS_BRIDGE_TOKEN ซ้ำ)", () => {
  assert.match(route, /MBS_ADMIN_LICENSE_TOKEN/);
  assert.doesNotMatch(route, /process\.env\.MBS_BRIDGE_TOKEN/);
  assert.match(route, /hasBridgeServiceToken\(request, configuredToken\)/);
  assert.match(envExample, /^MBS_ADMIN_LICENSE_TOKEN=/m);
});

test("proxy อนุญาต bridge path ผ่านไปให้ route handler ตรวจ token เอง", () => {
  assert.match(proxy, /"\/api\/bridge\/admin-license"/);
});

test("Admin license bridge ปฏิเสธเมื่อยังไม่ตั้ง token (fail closed)", () => {
  assert.match(route, /if \(!configuredToken\)/);
  assert.match(route, /503/);
  assert.match(route, /Unauthorized/);
});

test("License logic ยังอยู่ใน Core — bridge เรียก lib/license.ts ไม่ copy algorithm", () => {
  assert.match(route, /from "@\/lib\/license"/);
  assert.match(route, /createLicenseKey\(/);
  assert.match(route, /verifyLicenseKey\(/);
  assert.match(route, /getSigningSalt\(/);
  assert.doesNotMatch(route, /createHmac|timingSafeEqual/);
});

test("bridge รองรับ ISSUE/RENEW/REVOKE/VERIFY และมี dry_run สำหรับทดสอบไม่เขียน DB", () => {
  for (const action of ["ISSUE", "RENEW", "REVOKE", "VERIFY"]) {
    assert.ok(route.includes(`"${action}"`), `ต้องรองรับ ${action}`);
  }
  assert.match(route, /dryRun\s*=\s*body\.dry_run\s*===\s*true/);
  assert.match(route, /if \(!dryRun\)/);
});

test("REVOKE ล้าง license_key และตั้งสถานะ Revoked (ไม่ทิ้ง key เก่าให้จำหน่ายต่อ)", () => {
  assert.match(route, /license_key = NULL/);
  assert.match(route, /subscription_status = 'Revoked'/);
  assert.match(route, /'REVOKE'/);
});
