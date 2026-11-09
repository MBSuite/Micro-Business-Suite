import { test } from "node:test";
import assert from "node:assert/strict";
import { getTrustedSsoCallback } from "../lib/sso-trust";

test("SSO audience resolves only to the registered callback", () => {
  assert.equal(
    getTrustedSsoCallback("mbs-service"),
    "https://micro-business-service.vercel.app/auth/sso-callback"
  );
  assert.equal(
    getTrustedSsoCallback(
      "mbs-retail",
      "https://micro-business-retail.vercel.app/auth/sso-callback"
    ),
    "https://micro-business-retail.vercel.app/auth/sso-callback"
  );
});

test("SSO rejects unknown audiences and callback URL substitutions", () => {
  assert.equal(getTrustedSsoCallback("attacker"), null);
  assert.equal(getTrustedSsoCallback("mbs-service", "https://attacker.example/callback"), null);
  assert.equal(
    getTrustedSsoCallback("mbs-service", "https://micro-business-service.vercel.app.evil.example/auth/sso-callback"),
    null
  );
});
