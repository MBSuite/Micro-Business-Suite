import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomBytes } from "node:crypto";
import {
  MAX_OUTBOUND_TEXT,
  isThreadPriority,
  isThreadStatus,
  maskExternalId,
  normalizeOutboundText,
  supportsOutbound,
} from "../lib/support-outbound";

/**
 * Unit tests for support-channel primitives.
 * Only pure functions — no database, no network.
 */

const TEST_CHANNEL_SECRET = "test-line-channel-secret";
const TEST_ENCRYPTION_KEY = randomBytes(32).toString("base64");

let verifyLineSignature: typeof import("../lib/line").verifyLineSignature;
let encryptSupportSecret: typeof import("../lib/support-crypto").encryptSupportSecret;
let decryptSupportSecret: typeof import("../lib/support-crypto").decryptSupportSecret;
let isEncryptedSupportSecret: typeof import("../lib/support-crypto").isEncryptedSupportSecret;

before(async () => {
  process.env.LINE_CHANNEL_SECRET = TEST_CHANNEL_SECRET;
  process.env.SUPPORT_TOKEN_ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;

  ({ verifyLineSignature } = await import("../lib/line"));
  ({ encryptSupportSecret, decryptSupportSecret, isEncryptedSupportSecret } = await import(
    "../lib/support-crypto"
  ));
});

function sign(body: string, secret = TEST_CHANNEL_SECRET) {
  return createHmac("sha256", secret).update(body, "utf8").digest("base64");
}

describe("LINE webhook signature", () => {
  const body = JSON.stringify({ destination: "Utest", events: [] });

  test("accepts a signature produced with the channel secret", () => {
    assert.equal(verifyLineSignature(body, sign(body)), true);
  });

  test("rejects a signature produced with another secret", () => {
    assert.equal(verifyLineSignature(body, sign(body, "wrong-secret")), false);
  });

  test("rejects a body modified after signing", () => {
    const signature = sign(body);
    assert.equal(verifyLineSignature(`${body} `, signature), false);
  });

  test("rejects a missing signature", () => {
    assert.equal(verifyLineSignature(body, null), false);
  });

  test("rejects a malformed signature", () => {
    assert.equal(verifyLineSignature(body, "not-base64-@@@"), false);
  });
});

describe("support credential encryption", () => {
  test("round-trips a plaintext secret", () => {
    const plaintext = "channel-access-token-value";
    const encrypted = encryptSupportSecret(plaintext);

    assert.equal(isEncryptedSupportSecret(encrypted), true);
    assert.equal(encrypted.includes(plaintext), false);
    assert.equal(decryptSupportSecret(encrypted), plaintext);
  });

  test("produces a different ciphertext each time", () => {
    const first = encryptSupportSecret("same-value");
    const second = encryptSupportSecret("same-value");
    assert.notEqual(first, second);
  });

  test("rejects a value that is not encrypted", () => {
    assert.throws(() => decryptSupportSecret("plain-value"));
  });

  test("rejects tampered ciphertext", () => {
    const encrypted = encryptSupportSecret("value");
    const parts = encrypted.split(":");
    parts[4] = `${parts[4].slice(0, -4)}AAAA`;
    assert.throws(() => decryptSupportSecret(parts.join(":")));
  });
});

describe("support outbound rules", () => {
  test("trims text and accepts normal input", () => {
    const result = normalizeOutboundText("  สวัสดีครับ  ");
    assert.deepEqual(result, { ok: true, text: "สวัสดีครับ" });
  });

  test("rejects empty or whitespace-only text", () => {
    assert.deepEqual(normalizeOutboundText("   "), { ok: false, reason: "empty" });
  });

  test("rejects non-string input", () => {
    assert.deepEqual(normalizeOutboundText(42), { ok: false, reason: "invalid" });
  });

  test("rejects text longer than the provider limit", () => {
    const result = normalizeOutboundText("ก".repeat(MAX_OUTBOUND_TEXT + 1));
    assert.deepEqual(result, { ok: false, reason: "too_long" });
  });

  test("only LINE has outbound support", () => {
    assert.equal(supportsOutbound("line"), true);
    assert.equal(supportsOutbound("discord"), false);
    assert.equal(supportsOutbound("inapp"), false);
  });

  test("masks provider identifiers in API responses", () => {
    assert.equal(maskExternalId("U1234567890abcdef"), "…cdef");
    assert.equal(maskExternalId("abc"), "…");
    assert.equal(maskExternalId(null), null);
  });

  test("validates thread status and priority values", () => {
    assert.equal(isThreadStatus("closed"), true);
    assert.equal(isThreadStatus("deleted"), false);
    assert.equal(isThreadPriority("urgent"), true);
    assert.equal(isThreadPriority("whenever"), false);
  });
});
