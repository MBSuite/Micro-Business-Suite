import test from "node:test";
import assert from "node:assert/strict";
import { hasBridgeServiceToken } from "../lib/bridge-auth.mjs";

function requestWithAuthorization(value) {
  return new Request("https://example.test/api/bridge/sync", {
    headers: value ? { Authorization: value } : {},
  });
}

test("Bridge service token accepts the configured Bearer credential", () => {
  assert.equal(hasBridgeServiceToken(requestWithAuthorization("Bearer test-secret"), "test-secret"), true);
  assert.equal(hasBridgeServiceToken(requestWithAuthorization("bearer test-secret"), "test-secret"), true);
});

test("Bridge service token rejects missing, mismatched, or unconfigured credentials", () => {
  assert.equal(hasBridgeServiceToken(requestWithAuthorization(""), "test-secret"), false);
  assert.equal(hasBridgeServiceToken(requestWithAuthorization("Basic test-secret"), "test-secret"), false);
  assert.equal(hasBridgeServiceToken(requestWithAuthorization("Bearer wrong"), "test-secret"), false);
  assert.equal(hasBridgeServiceToken(requestWithAuthorization("Bearer test-secret"), ""), false);
});
