#!/usr/bin/env node
// Smoke test for Bridge Sync (Suite -> MBS Core) — READ-ONLY + single test event
// Usage:
//   node scripts/smoke-test-bridge.mjs
// Requires env: MBS_HUB_URL (or defaults to http://localhost:3000), MBS_BRIDGE_TOKEN, MBS_COMPANY_ID
//
// This script sends ONE test sync event and verifies the response. It does NOT
// delete data. Run against a TEST/STAGING instance only.

import { randomUUID } from "node:crypto";

try { require("dotenv").config({ path: ".env.local" }); } catch {}

const hubUrl = (process.env.MBS_HUB_URL || "http://localhost:3000").replace(/\/+$/, "");
const token = process.env.MBS_BRIDGE_TOKEN;
const companyId = Number(process.env.MBS_COMPANY_ID || "1");

if (!token) {
  console.error("❌ MBS_BRIDGE_TOKEN not set in .env.local");
  process.exit(1);
}

const idempotencyKey = `smoke-${randomUUID()}`;
const payload = {
  event: "order.paid",
  idempotency_key: idempotencyKey,
  company_id: companyId,
  data: {
    order_id: `smoke-${Date.now()}`,
    table_number: "T99",
    items: [{ product_name: "Smoke Test Item", qty: 1, price: 100 }],
    total: 107,
    payment_method: "cash",
    paid_at: new Date().toISOString(),
  },
};

console.log(`[smoke] POST ${hubUrl}/api/bridge/sync (company ${companyId})`);
const res = await fetch(`${hubUrl}/api/bridge/sync`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(payload),
});
const text = await res.text();
let json;
try { json = JSON.parse(text); } catch { json = null; }

console.log(`[smoke] HTTP ${res.status}`);
console.log(JSON.stringify(json || text, null, 2));

if (!res.ok || !json?.success) {
  console.error("❌ Smoke test FAILED");
  process.exit(1);
}

// Idempotency check
const res2 = await fetch(`${hubUrl}/api/bridge/sync`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify(payload),
});
const json2 = await res2.json().catch(() => null);
console.log(`[smoke] Idempotency re-send HTTP ${res2.status} (expect idempotent=true):`, json2?.idempotent);

if (!json2?.idempotent) {
  console.error("❌ Idempotency check FAILED");
  process.exit(1);
}

console.log("✅ Smoke test PASSED (sync + idempotency)");
console.log(`   sync_id: ${json.sync_id}, invoice: ${json.result?.invoice_number}`);
console.log("   Verify in DB: SELECT * FROM bridge_sync_log WHERE idempotency_key = '" + idempotencyKey + "';");
console.log("   Verify in DB: SELECT * FROM invoices WHERE company_id = " + companyId + " ORDER BY id DESC LIMIT 1;");
console.log("   Verify in DB: SELECT * FROM journal_entries WHERE company_id = " + companyId + " ORDER BY id DESC LIMIT 3;");
