import test from "node:test";
import assert from "node:assert/strict";
import {
  MODULES,
  isModuleName,
  normalizeLinkCode,
  normalizeShopCode,
  generateLinkCode,
  sha256Hex,
  linkCodeState,
  toIso,
  LINK_CODE_LENGTH,
} from "../lib/module-link-validation.mjs";

test("MODULES matches the six module apps", () => {
  assert.deepEqual(MODULES, ["retail", "rental", "pharmacy", "hotel", "fnb", "service"]);
  for (const m of MODULES) assert.equal(isModuleName(m), true);
  for (const m of ["core", "Retail", "", null, undefined, 1]) assert.equal(isModuleName(m), false);
});

test("normalizeLinkCode accepts 8 unambiguous chars and uppercases", () => {
  assert.equal(normalizeLinkCode("k7m2p9xa"), "K7M2P9XA");
  assert.equal(normalizeLinkCode("  K7M2P9XA  "), "K7M2P9XA");
});

test("normalizeLinkCode rejects ambiguous or wrong-length codes", () => {
  for (const value of ["K7M2P9X", "K7M2P9XAA", "K7M2P9XI", "K7M2P9X0", "K7M2P9X1", "K7M2P9XO", "", null, 123]) {
    assert.equal(normalizeLinkCode(value), null, `expected null for ${JSON.stringify(value)}`);
  }
});

test("normalizeShopCode accepts legacy numeric ids and R+6 shop codes", () => {
  assert.equal(normalizeShopCode("1"), "1");
  assert.equal(normalizeShopCode("42"), "42");
  assert.equal(normalizeShopCode(42), "42");
  assert.equal(normalizeShopCode("r7k2m9a"), "R7K2M9A");
});

test("normalizeShopCode rejects invalid shop codes", () => {
  for (const value of ["0", "01", "-1", "R7K2M9", "R7K2M9AB", "R7K2M9I", "ABC123", "", null, 1.5, 0]) {
    assert.equal(normalizeShopCode(value), null, `expected null for ${JSON.stringify(value)}`);
  }
});

test("generateLinkCode returns a code accepted by normalizeLinkCode", () => {
  for (let i = 0; i < 50; i += 1) {
    const code = generateLinkCode();
    assert.equal(code.length, LINK_CODE_LENGTH);
    assert.equal(normalizeLinkCode(code), code);
  }
});

test("generateLinkCode is deterministic with an injected source", () => {
  assert.equal(generateLinkCode(() => 0), "AAAAAAAA");
  assert.equal(
    generateLinkCode(() => 31),
    "99999999"
  );
});

test("sha256Hex is stable and does not leak plaintext", () => {
  const hash = sha256Hex("K7M2P9XA");
  assert.match(hash, /^[0-9a-f]{64}$/);
  assert.equal(hash, sha256Hex("K7M2P9XA"));
  assert.notEqual(hash, sha256Hex("K7M2P9XB"));
  assert.equal(hash.includes("K7M2P9XA"), false);
});

test("linkCodeState classifies missing, used, expired and usable codes", () => {
  const now = new Date("2026-11-10T10:00:00.000Z");
  assert.equal(linkCodeState(null, now), "invalid");
  assert.equal(linkCodeState({ expires_at: "2026-11-10T10:15:00.000Z", used_at: "2026-11-10T10:01:00.000Z" }, now), "used");
  assert.equal(linkCodeState({ expires_at: "2026-11-10T09:59:59.000Z", used_at: null }, now), "expired");
  assert.equal(linkCodeState({ expires_at: "2026-11-10T10:15:00.000Z", used_at: null }, now), "ok");
});

test("toIso normalizes timestamps and rejects empty values", () => {
  assert.equal(toIso("2026-11-10T10:00:00Z"), "2026-11-10T10:00:00.000Z");
  assert.equal(toIso(null), null);
  assert.equal(toIso(undefined), null);
  assert.equal(toIso("not-a-date"), null);
});
