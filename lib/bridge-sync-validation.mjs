// lib/bridge-sync-validation.mjs
// Pure validation helpers for /api/bridge/sync (testable via node:test).

export const ALLOWED_EVENTS = new Set(["order.paid", "payment.received"]);

export function validateBridgeSyncPayload(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Invalid JSON body" };
  }

  const event = String(body.event ?? "").trim();
  const idempotencyKey = String(body.idempotency_key ?? "").trim();

  if (!event) return { ok: false, error: "event is required" };
  if (!ALLOWED_EVENTS.has(event)) return { ok: false, error: `Unsupported event: ${event}` };
  if (!idempotencyKey) return { ok: false, error: "idempotency_key is required" };
  if (!body.data || typeof body.data !== "object" || Array.isArray(body.data)) {
    return { ok: false, error: "data is required" };
  }

  let companyId = null;
  if (body.company_id !== undefined && body.company_id !== null && body.company_id !== "") {
    const c = Number(body.company_id);
    if (!Number.isInteger(c) || c < 1) {
      return { ok: false, error: "company_id must be a positive integer" };
    }
    companyId = c;
  }

  return {
    ok: true,
    value: { event, idempotencyKey, companyId, data: body.data },
  };
}

export function validateOrderPaidData(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, error: "data is required" };
  }
  if (data.items !== undefined && !Array.isArray(data.items)) {
    return { ok: false, error: "items must be an array" };
  }
  if (data.total !== undefined && data.total !== null) {
    const t = Number(data.total);
    if (!Number.isFinite(t) || t < 0) {
      return { ok: false, error: "total must be a non-negative number" };
    }
  }
  if (data.order_id !== undefined && data.order_id !== null) {
    const t = typeof data.order_id;
    if (t !== "string" && t !== "number") {
      return { ok: false, error: "order_id must be string or number" };
    }
  }
  if (data.payment_method !== undefined && data.payment_method !== null) {
    const m = String(data.payment_method).trim();
    if (!m) return { ok: false, error: "payment_method cannot be empty" };
  }
  return { ok: true };
}

export function isAllowedEvent(event) {
  return ALLOWED_EVENTS.has(String(event ?? "").trim());
}
