import test from "node:test";
import assert from "node:assert/strict";
import {
  ALLOWED_EVENTS,
  validateBridgeSyncPayload,
  validateOrderPaidData,
  isAllowedEvent,
} from "../lib/bridge-sync-validation.mjs";

// --- ALLOWED_EVENTS / isAllowedEvent ---
test("ALLOWED_EVENTS contains only implemented finance events", () => {
  assert.ok(ALLOWED_EVENTS.has("order.paid"));
  assert.ok(ALLOWED_EVENTS.has("payment.received"));
  assert.equal(ALLOWED_EVENTS.size, 2);
  for (const event of ["hotel.booking", "rental.contract", "pharmacy.sale", "retail.sale", "quotation.created"]) {
    assert.equal(isAllowedEvent(event), false);
  }
});

test("isAllowedEvent accepts allowed and rejects unknown", () => {
  assert.equal(isAllowedEvent("order.paid"), true);
  assert.equal(isAllowedEvent("payment.received"), true);
  assert.equal(isAllowedEvent("foo.bar"), false);
  assert.equal(isAllowedEvent(""), false);
  assert.equal(isAllowedEvent(null), false);
});

// --- validateBridgeSyncPayload ---
test("validateBridgeSyncPayload rejects non-object body", () => {
  for (const b of [null, undefined, 42, "str", true, []]) {
    const r = validateBridgeSyncPayload(b);
    assert.equal(r.ok, false, `expected fail for ${JSON.stringify(b)}`);
  }
});

test("validateBridgeSyncPayload requires event", () => {
  const r = validateBridgeSyncPayload({ idempotency_key: "k", data: {} });
  assert.equal(r.ok, false);
  assert.match(r.error, /event is required/);
});

test("validateBridgeSyncPayload rejects unsupported event", () => {
  const r = validateBridgeSyncPayload({ event: "foo.bar", idempotency_key: "k", data: {} });
  assert.equal(r.ok, false);
  assert.match(r.error, /Unsupported event/);
});

test("validateBridgeSyncPayload requires idempotency_key", () => {
  const r = validateBridgeSyncPayload({ event: "order.paid", data: {} });
  assert.equal(r.ok, false);
  assert.match(r.error, /idempotency_key is required/);
});

test("validateBridgeSyncPayload requires data object", () => {
  for (const d of [undefined, null, "x", 5, true, []]) {
    const r = validateBridgeSyncPayload({ event: "order.paid", idempotency_key: "k", data: d });
    assert.equal(r.ok, false, `expected fail for data=${JSON.stringify(d)}`);
    assert.match(r.error, /data is required/);
  }
});

test("validateBridgeSyncPayload validates company_id", () => {
  const bad = validateBridgeSyncPayload({ event: "order.paid", idempotency_key: "k", data: {}, company_id: 0 });
  assert.equal(bad.ok, false);
  assert.match(bad.error, /company_id must be a positive integer/);

  const bad2 = validateBridgeSyncPayload({ event: "order.paid", idempotency_key: "k", data: {}, company_id: "abc" });
  assert.equal(bad2.ok, false);

  const good = validateBridgeSyncPayload({ event: "order.paid", idempotency_key: "k", data: {}, company_id: 3 });
  assert.equal(good.ok, true);
  assert.equal(good.value.companyId, 3);
});

test("validateBridgeSyncPayload trims event and key", () => {
  const r = validateBridgeSyncPayload({ event: "  order.paid  ", idempotency_key: "  key-1  ", data: { a: 1 } });
  assert.equal(r.ok, true);
  assert.equal(r.value.event, "order.paid");
  assert.equal(r.value.idempotencyKey, "key-1");
  assert.deepEqual(r.value.data, { a: 1 });
});

test("validateBridgeSyncPayload allows missing company_id (session auth)", () => {
  const r = validateBridgeSyncPayload({ event: "order.paid", idempotency_key: "k", data: {} });
  assert.equal(r.ok, true);
  assert.equal(r.value.companyId, null);
});

// --- validateOrderPaidData ---
test("validateOrderPaidData rejects non-object", () => {
  for (const d of [null, undefined, "x", 5, true, []]) {
    const r = validateOrderPaidData(d);
    assert.equal(r.ok, false);
  }
});

test("validateOrderPaidData validates items", () => {
  const r = validateOrderPaidData({ items: "nope" });
  assert.equal(r.ok, false);
  assert.match(r.error, /items must be an array/);
  assert.equal(validateOrderPaidData({ items: [] }).ok, true);
});

test("validateOrderPaidData validates total", () => {
  assert.equal(validateOrderPaidData({ total: -1 }).ok, false);
  assert.equal(validateOrderPaidData({ total: "abc" }).ok, false);
  assert.equal(validateOrderPaidData({ total: Infinity }).ok, false);
  assert.equal(validateOrderPaidData({ total: 0 }).ok, true);
  assert.equal(validateOrderPaidData({ total: 12.5 }).ok, true);
  assert.equal(validateOrderPaidData({}).ok, true);
});

test("validateOrderPaidData validates order_id", () => {
  assert.equal(validateOrderPaidData({ order_id: { x: 1 } }).ok, false);
  assert.equal(validateOrderPaidData({ order_id: "abc" }).ok, true);
  assert.equal(validateOrderPaidData({ order_id: 42 }).ok, true);
  assert.equal(validateOrderPaidData({ order_id: null }).ok, true);
});

test("validateOrderPaidData validates payment_method", () => {
  assert.equal(validateOrderPaidData({ payment_method: "   " }).ok, false);
  assert.equal(validateOrderPaidData({ payment_method: "cash" }).ok, true);
});

// Note: auth (service token vs session) and idempotency (duplicate key -> existing record)
// are covered by integration/e2e: scripts/smoke-test-bridge.mjs and tests/integration.
