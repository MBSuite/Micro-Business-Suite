#!/usr/bin/env node
// scripts/smoke-test-bridge.mjs
// Smoke test for /api/bridge/sync (MBS Core).
// Requires env: MBS_HUB_URL, MBS_BRIDGE_TOKEN, MBS_COMPANY_ID (default 1)
//
// Usage:
//   MBS_HUB_URL=https://micro-business-suite.vercel.app MBS_BRIDGE_TOKEN=xxx node scripts/smoke-test-bridge.mjs
//   node scripts/smoke-test-bridge.mjs --dry-run   # only GET health, no writes
//
// WARNING: non-dry-run creates a real invoice + journal entry in the target DB.

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

const hubUrl = (process.env.MBS_HUB_URL || "").replace(/\/+$/, "");
const token = process.env.MBS_BRIDGE_TOKEN || "";
const companyId = Number(process.env.MBS_COMPANY_ID || "1");

if (!hubUrl) {
  console.error("ERROR: MBS_HUB_URL not set.");
  process.exit(1);
}
if (!token && !dryRun) {
  console.error("ERROR: MBS_BRIDGE_TOKEN not set (required for write tests).");
  process.exit(1);
}

const maskedToken = token ? `${token.slice(0, 4)}...${token.slice(-4)}` : "(none)";
console.log(`Hub: ${hubUrl}`);
console.log(`Token: ${maskedToken}`);
console.log(`Company: ${companyId}`);
console.log(`Mode: ${dryRun ? "DRY RUN (read-only)" : "WRITE (creates invoice/journal)"}\n`);

let pass = 0, fail = 0;
function ok(msg) { pass++; console.log(`  ✅ ${msg}`); }
function bad(msg) { fail++; console.log(`  ❌ ${msg}`); }

async function req(method, path, { headers = {}, body } = {}) {
  const res = await fetch(`${hubUrl}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { _raw: text }; }
  return { status: res.status, json };
}

// 1. GET health
{
  const { status, json } = await req("GET", "/api/bridge/sync");
  if (status === 200 && Array.isArray(json.allowed_events)) ok(`GET /api/bridge/sync -> 200 (events: ${json.allowed_events.join(", ")})`);
  else bad(`GET health failed: ${status} ${JSON.stringify(json)}`);
}

if (dryRun) {
  console.log(`\nDry run complete: ${pass} passed, ${fail} failed.`);
  process.exit(fail ? 1 : 0);
}

const idempotencyKey = `smoke-${Date.now()}`;
const payload = {
  event: "order.paid",
  idempotency_key: idempotencyKey,
  company_id: companyId,
  data: {
    order_id: `smoke-${Date.now()}`,
    table_number: "SMOKE",
    items: [{ product_name: "Smoke Test Item", qty: 1, price: 10.0 }],
    total: 10.0,
    payment_method: "cash",
    paid_at: new Date().toISOString(),
  },
};

// 2. Valid POST
let syncId = null;
{
  const { status, json } = await req("POST", "/api/bridge/sync", {
    headers: { Authorization: `Bearer ${token}` },
    body: payload,
  });
  if (status === 200 && json.success === true) {
    syncId = json.sync_id;
    ok(`POST valid -> 200 (sync_id=${syncId}, invoice_id=${json.result?.invoice_id})`);
  } else bad(`POST valid failed: ${status} ${JSON.stringify(json)}`);
}

// 3. Idempotency (same key)
if (syncId) {
  const { status, json } = await req("POST", "/api/bridge/sync", {
    headers: { Authorization: `Bearer ${token}` },
    body: payload,
  });
  if (status === 200 && json.idempotent === true) ok(`Idempotency -> 200 (idempotent=true)`);
  else bad(`Idempotency failed: ${status} ${JSON.stringify(json)}`);
}

// 4. Invalid token -> 401
{
  const { status } = await req("POST", "/api/bridge/sync", {
    headers: { Authorization: "Bearer invalid-token-xxx" },
    body: { ...payload, idempotency_key: `smoke-invalid-${Date.now()}` },
  });
  if (status === 401) ok("Invalid token -> 401");
  else bad(`Invalid token expected 401, got ${status}`);
}

// 5. Unsupported event -> 400
{
  const { status } = await req("POST", "/api/bridge/sync", {
    headers: { Authorization: `Bearer ${token}` },
    body: { ...payload, event: "foo.bar", idempotency_key: `smoke-bad-${Date.now()}` },
  });
  if (status === 400) ok("Unsupported event -> 400");
  else bad(`Unsupported event expected 400, got ${status}`);
}

// 6. Missing idempotency_key -> 400
{
  const { status } = await req("POST", "/api/bridge/sync", {
    headers: { Authorization: `Bearer ${token}` },
    body: { event: "order.paid", company_id: companyId, data: payload.data },
  });
  if (status === 400) ok("Missing idempotency_key -> 400");
  else bad(`Missing key expected 400, got ${status}`);
}

console.log(`\nResult: ${pass} passed, ${fail} failed.`);
if (syncId) console.log(`Note: smoke test created invoice (sync_id=${syncId}) in production DB. Clean up if needed.`);
process.exit(fail ? 1 : 0);
