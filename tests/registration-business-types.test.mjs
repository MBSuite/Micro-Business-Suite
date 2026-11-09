import test from "node:test";
import assert from "node:assert/strict";
import {
  getRegistrationPluginPack,
  isRegistrationBusinessType,
  REGISTRATION_BUSINESS_TYPES,
} from "../lib/registration-business-types.mjs";

test("registration offers supported business types and matching plugin packs", () => {
  const options = Object.fromEntries(REGISTRATION_BUSINESS_TYPES.map(({ value, label }) => [value, label]));

  assert.ok(options.rental);
  assert.ok(options.hotel);
  assert.equal(getRegistrationPluginPack("rental"), "rental");
  assert.equal(getRegistrationPluginPack("hotel"), "hotel_booking");
  assert.equal(getRegistrationPluginPack("retail"), "retail_pos");
  assert.equal(getRegistrationPluginPack("general"), null);
});

test("registration rejects unsupported business types", () => {
  for (const value of ["", "unknown", "hotel_booking", null, 5]) {
    assert.equal(isRegistrationBusinessType(value), false);
  }
});
