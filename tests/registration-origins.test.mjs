import test from "node:test";
import assert from "node:assert/strict";
import { getRegistrationOrigin } from "../lib/registration-origins.mjs";

test("known module origins resolve to their fixed business types", () => {
  const moduleBusinessTypes = [
    ["https://micro-business-service.vercel.app", "service"],
    ["https://micro-business-retail.vercel.app", "retail"],
    ["https://micro-business-rental.vercel.app", "rental"],
    ["https://micro-business-pharmacy.vercel.app", "pharmacy"],
    ["https://micro-business-hotel.vercel.app", "hotel"],
    ["https://micro-business-fnb.vercel.app", "fnb"],
  ];

  for (const [origin, businessType] of moduleBusinessTypes) {
    assert.deepEqual(getRegistrationOrigin(origin), { origin, businessType });
  }
});

test("Core origin allows the form to choose a supported business type", () => {
  assert.deepEqual(
    getRegistrationOrigin("https://micro-business-suite.vercel.app"),
    { origin: "https://micro-business-suite.vercel.app", businessType: null }
  );
});

test("unknown, malformed, opaque, or non-origin values are rejected", () => {
  for (const origin of [
    undefined,
    "null",
    "https://example.com",
    "https://micro-business-service.vercel.app/path",
    "http://micro-business-service.vercel.app",
    "https://micro-business-service.vercel.app.evil.test",
  ]) {
    assert.equal(getRegistrationOrigin(origin), null);
  }
});

test("additional development origins must be explicitly configured", () => {
  assert.deepEqual(
    getRegistrationOrigin("http://localhost:3000", "http://localhost:3000"),
    { origin: "http://localhost:3000", businessType: null }
  );
  assert.equal(getRegistrationOrigin("http://localhost:3000"), null);
});
