import { test, before, after } from "node:test";
import { createHmac } from "node:crypto";
import assert from "node:assert/strict";
import { Client } from "pg";

const baseUrl = process.env.MBS_TEST_BASE_URL;
const databaseUrl = process.env.MBS_TEST_DATABASE_URL;
const jwtSecret = process.env.MBS_TEST_JWT_SECRET;
const productionUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const enabled = Boolean(baseUrl && databaseUrl && jwtSecret);

let client;
let defaultUserIds = {};

function skipUnlessConfigured(t) {
  if (!enabled) {
    t.skip("Set MBS_TEST_BASE_URL, MBS_TEST_DATABASE_URL, and MBS_TEST_JWT_SECRET to run integration security tests");
    return false;
  }
  return true;
}

function assertNotProductionDatabase() {
  assert.ok(databaseUrl, "MBS_TEST_DATABASE_URL is required");
  assert.ok(productionUrl, "DATABASE_URL or POSTGRES_URL must be configured for the production-safety comparison");
  assert.notEqual(databaseUrl, productionUrl, "MBS_TEST_DATABASE_URL must not equal DATABASE_URL or POSTGRES_URL");
}

async function tokenFor(role, id = String(defaultUserIds[role] || "1")) {
  const { SignJWT } = await import("jose");
  return new SignJWT({
    id,
    email: `${role}@security-test.invalid`,
    name: `Security ${role}`,
    role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(new TextEncoder().encode(jwtSecret));
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers);
  if (options.token) headers.set("Cookie", `session-token=${options.token}`);
  return fetch(new URL(path, baseUrl), {
    ...options,
    headers,
    redirect: "manual",
  });
}

async function expectStatus(path, status, options = {}) {
  const response = await request(path, options);
  assert.equal(response.status, status, `${options.method || "GET"} ${path} should return ${status}, got ${response.status}`);
  return response;
}

before(async () => {
  if (!enabled) return;
  assertNotProductionDatabase();
  client = new Client({ connectionString: databaseUrl });
  await client.connect();
  const fixture = `security-session-${Date.now()}`;
  const company = await client.query(
    "INSERT INTO companies (name) VALUES ($1) RETURNING id",
    [fixture],
  );
  for (const role of ["user", "admin", "superadmin"]) {
    const user = await client.query(
      `INSERT INTO users (name, email, password, role, status, company_id)
       VALUES ($1, $2, $3, $4, 'active', $5)
       RETURNING id`,
      [`Security ${role}`, `${fixture}-${role}@security-test.invalid`, "not-a-password", role, company.rows[0].id],
    );
    defaultUserIds[role] = user.rows[0].id;
  }
  defaultUserIds.companyId = company.rows[0].id;
});

after(async () => {
  if (client && defaultUserIds.companyId) {
    await client.query(
      "DELETE FROM users WHERE company_id = $1",
      [defaultUserIds.companyId],
    );
    await client.query("DELETE FROM companies WHERE id = $1", [defaultUserIds.companyId]);
  }
  await client?.end();
});

test("test database is isolated from production configuration", async (t) => {
  if (!skipUnlessConfigured(t)) return;
  assertNotProductionDatabase();
  const result = await client.query("SELECT current_database() AS database_name");
  assert.ok(result.rows[0]?.database_name, "test database connection should be usable");
});

test("protected routes reject requests without a token", async (t) => {
  if (!skipUnlessConfigured(t)) return;
  const protectedRoutes = [
    ["/api/payments", "GET"],
    ["/api/payments/1", "GET"],
    ["/api/company", "GET"],
    ["/api/settings", "GET"],
    ["/api/google-drive/connect", "GET"],
    ["/api/google-drive/disconnect", "POST"],
    ["/api/import", "POST"],
    ["/api/admin/backup", "GET"],
    ["/api/users/1", "DELETE"],
    ["/api/db_schema", "GET"],
  ];

  for (const [path, method] of protectedRoutes) {
    await expectStatus(path, 401, {
      method,
      body: method === "POST" ? "{}" : undefined,
      headers: method === "POST" ? { "Content-Type": "application/json" } : undefined,
    });
  }
});

test("Bridge metadata requires a session or service Bearer token", async (t) => {
  if (!skipUnlessConfigured(t)) return;

  await expectStatus("/api/bridge/sync", 401);

  const serviceResponse = await request("/api/bridge/sync", {
    headers: { Authorization: "Bearer integration-bridge-token" },
  });
  assert.equal(serviceResponse.status, 200);
  const serviceBody = await serviceResponse.json();
  assert.deepEqual(serviceBody.allowed_events.sort(), ["order.paid", "payment.received"]);

  const sessionResponse = await request("/api/bridge/sync", {
    token: await tokenFor("user"),
  });
  assert.equal(sessionResponse.status, 200);
});

test("registration page offers Rental and Hotel business types", async (t) => {
  if (!skipUnlessConfigured(t)) return;

  const response = await request("/register");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /value="rental"/);
  assert.match(html, /value="hotel"/);
});

test("regular users cannot access admin actions", async (t) => {
  if (!skipUnlessConfigured(t)) return;
  const token = await tokenFor("user");

  await expectStatus("/api/admin/backup?format=json", 403, { token });
  await expectStatus("/api/google-drive/connect", 403, { token });
  await expectStatus("/api/google-drive/disconnect", 403, { method: "POST", token });
  await expectStatus("/api/reset_billing", 403, {
    method: "POST",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirmToken: "RESET_BILLING_CONFIRMED" }),
  });
});

test("superadmin can reach non-destructive admin backup on test database", async (t) => {
  if (!skipUnlessConfigured(t)) return;
  const token = await tokenFor("superadmin");
  const response = await request("/api/admin/backup?format=json", { token });
  assert.equal(response.status, 200, `superadmin backup should return 200, got ${response.status}`);
  assert.match(response.headers.get("content-type") || "", /application\/json/);
});

test("legacy webhook requires an idempotency key and creates an invoice only once", async (t) => {
  if (!skipUnlessConfigured(t)) return;
  const companyId = defaultUserIds.companyId;
  const prefix = `WH${Date.now()}-`;
  await client.query(
    `INSERT INTO company_settings (company_id, name, invoice_prefix)
     VALUES ($1, 'Webhook test', $2)
     ON CONFLICT (company_id) WHERE company_id IS NOT NULL
     DO UPDATE SET invoice_prefix = EXCLUDED.invoice_prefix`,
    [companyId, prefix],
  );
  const token = await tokenFor("user");
  const payload = {
    provider: "integration-test",
    event: "order",
    order: { items: [{ description: "Test item", qty: 2, price: 10 }] },
  };
  const missingKeyResponse = await request("/api/integrations/webhook", {
    method: "POST",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  assert.equal(missingKeyResponse.status, 400);

  const key = `webhook-test-${Date.now()}`;
  const send = () => request("/api/integrations/webhook", {
    method: "POST",
    token,
    headers: { "Content-Type": "application/json", "Idempotency-Key": key },
    body: JSON.stringify(payload),
  });
  const responses = await Promise.all([send(), send()]);
  assert.deepEqual(responses.map((response) => response.status), [200, 200]);
  const results = await Promise.all(responses.map((response) => response.json()));
  assert.equal(results[0].invoiceId, results[1].invoiceId);
  assert.equal(results.filter((result) => result.duplicate === true).length, 1);
  const invoices = await client.query(
    "SELECT id FROM invoices WHERE company_id = $1 AND invoice_number LIKE $2",
    [companyId, `${prefix}%`],
  );
  assert.equal(invoices.rowCount, 1);
});

test("legacy webhook rejects users without a valid company mapping", async (t) => {
  if (!skipUnlessConfigured(t)) return;
  const fixture = `unmapped-user-${Date.now()}`;
  const user = await client.query(
    `INSERT INTO users (name, email, password, role, status, company_id)
     VALUES ($1, $2, 'unused', 'user', 'active', NULL)
     RETURNING id`,
    [fixture, `${fixture}@security-test.invalid`],
  );
  try {
    const response = await request("/api/integrations/webhook", {
      method: "POST",
      token: await tokenFor("user", String(user.rows[0].id)),
      headers: { "Content-Type": "application/json", "Idempotency-Key": fixture },
      body: JSON.stringify({ provider: "integration-test", event: "order" }),
    });
    assert.equal(response.status, 403);
  } finally {
    await client.query("DELETE FROM users WHERE id = $1", [user.rows[0].id]);
  }
});

test("admin can delete a company member and deleted sessions are invalid", async (t) => {
  if (!skipUnlessConfigured(t)) return;
  const fixture = `member_delete_${Date.now()}`;
  const company = await client.query(
    "INSERT INTO companies (name) VALUES ($1) RETURNING id",
    [fixture],
  );
  const admin = await client.query(
    `INSERT INTO users (name, email, password, role, status, company_id)
     VALUES ($1, $2, $3, 'admin', 'active', $4) RETURNING id`,
    ["Member Delete Admin", `${fixture}-admin@security-test.invalid`, "unused", company.rows[0].id],
  );
  const member = await client.query(
    `INSERT INTO users (name, email, password, role, status, company_id)
     VALUES ($1, $2, $3, 'user', 'active', $4) RETURNING id`,
    ["Member Delete Target", `${fixture}-member@security-test.invalid`, "unused", company.rows[0].id],
  );
  await client.query(
    "INSERT INTO user_groups (user_id, group_id) VALUES ($1, 3)",
    [member.rows[0].id],
  );

  try {
    const token = await tokenFor("admin", String(admin.rows[0].id));
    const response = await request(`/api/users/${member.rows[0].id}`, {
      method: "DELETE",
      token,
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      success: true,
      deletedUserId: member.rows[0].id,
    });

    const deletedUser = await client.query(
      "SELECT id FROM users WHERE id = $1",
      [member.rows[0].id],
    );
    assert.equal(deletedUser.rowCount, 0);
    const deletedGroups = await client.query(
      "SELECT id FROM user_groups WHERE user_id = $1",
      [member.rows[0].id],
    );
    assert.equal(deletedGroups.rowCount, 0);

    const deletedSessionToken = await tokenFor("user", String(member.rows[0].id));
    await expectStatus("/api/bridge/sync", 401, { token: deletedSessionToken });
  } finally {
    await client.query("DELETE FROM users WHERE id = ANY($1::int[])", [
      [admin.rows[0].id, member.rows[0].id],
    ]);
    await client.query("DELETE FROM companies WHERE id = $1", [company.rows[0].id]);
  }
});

test("internal diagnostics: db_schema OK for superadmin; production-only routes stay blocked", async (t) => {
  if (!skipUnlessConfigured(t)) return;
  const token = await tokenFor("superadmin");

  await expectStatus("/api/db_schema", 200, { token });
  await expectStatus("/api/debug/auth", 404, { token });
  await expectStatus("/api/migrate", 404, { method: "POST", token });
  await expectStatus("/system-audit?test=database", 404, { token });
});

test("cross-company payment access is denied", async (t) => {
  if (!skipUnlessConfigured(t)) return;
  const fixture = `security_${Date.now()}`;

  await client.query("BEGIN");
  try {
    const tenantColumns = await client.query(
      `SELECT table_name, column_name
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name IN ('invoices', 'payments')
         AND column_name = 'company_id'`,
    );
    assert.equal(
      tenantColumns.rows.length,
      2,
      "payments and invoices must expose company_id before cross-company authorization can be verified",
    );

    const companies = await client.query(
      "INSERT INTO companies (name) VALUES ($1), ($2) RETURNING id",
      [`${fixture}_a`, `${fixture}_b`],
    );
    const [companyA, companyB] = companies.rows;
    const users = await client.query(
      "INSERT INTO users (name, email, password, role, status, company_id) VALUES ($1, $2, $3, 'user', 'active', $4) RETURNING id",
      ["Security Test User", `${fixture}@security-test.invalid`, "not-a-password", companyA.id],
    );
    const invoice = await client.query(
      "INSERT INTO invoices (invoice_number, issue_date, net_amount, vat_amount, status, company_id) VALUES ($1, CURRENT_DATE, 1, 0, 'pending', $2) RETURNING id",
      [`${fixture}_invoice`, companyB.id],
    );
    const payment = await client.query(
      "INSERT INTO payments (payment_no, invoice_id, amount, payment_date, payment_method, status, company_id) VALUES ($1, $2, 1, CURRENT_DATE, 'test', 'completed', $3) RETURNING id",
      [`${fixture}_payment`, invoice.rows[0].id, companyB.id],
    );

    await client.query("COMMIT");
    const token = await tokenFor("user", String(users.rows[0].id));
    const response = await request(`/api/payments/${payment.rows[0].id}`, { token });
    assert.ok([403, 404].includes(response.status), `cross-company payment access should return 403/404, got ${response.status}`);
  } finally {
    await client.query("ROLLBACK");
    await client.query("BEGIN");
    await client.query("DELETE FROM payments WHERE payment_no LIKE $1", [`${fixture}_%`]);
    await client.query("DELETE FROM invoices WHERE invoice_number LIKE $1", [`${fixture}_%`]);
    await client.query("DELETE FROM users WHERE email = $1", [`${fixture}@security-test.invalid`]);
    await client.query("DELETE FROM companies WHERE name LIKE $1", [`${fixture}_%`]);
    await client.query("COMMIT");
  }
});

test("non-superadmins cannot assign the superadmin group", async (t) => {
  if (!skipUnlessConfigured(t)) return;
  const fixture = `group_security_${Date.now()}`;
  const company = await client.query(
    "INSERT INTO companies (name) VALUES ($1) RETURNING id",
    [fixture],
  );
  const admin = await client.query(
    "INSERT INTO users (name, email, password, role, status, company_id) VALUES ($1, $2, $3, 'admin', 'active', $4) RETURNING id",
    ["Test Admin", `${fixture}_admin@security-test.invalid`, "not-a-password", company.rows[0].id],
  );
  const target = await client.query(
    "INSERT INTO users (name, email, password, role, status, company_id) VALUES ($1, $2, $3, 'user', 'active', $4) RETURNING id",
    ["Test Target", `${fixture}_target@security-test.invalid`, "not-a-password", company.rows[0].id],
  );
  await client.query(
    "INSERT INTO user_groups (user_id, group_id) VALUES ($1, 1)",
    [admin.rows[0].id],
  );

  try {
    const token = await tokenFor("admin", String(admin.rows[0].id));
    const staleGroupAccess = await request("/api/ai/audit", { token });
    assert.equal(staleGroupAccess.status, 403, "a legacy group 1 membership must not grant superadmin access");

    const response = await request(`/api/users/${target.rows[0].id}/groups`, {
      method: "POST",
      token,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupIds: [1] }),
    });
    assert.equal(response.status, 403, "an admin must not assign the superadmin group");
    const membership = await client.query(
      "SELECT 1 FROM user_groups WHERE user_id = $1 AND group_id = 1",
      [target.rows[0].id],
    );
    assert.equal(membership.rowCount, 0, "the denied request must not create a group assignment");
  } finally {
    await client.query("DELETE FROM users WHERE id = ANY($1::int[])", [
      [admin.rows[0].id, target.rows[0].id],
    ]);
    await client.query("DELETE FROM companies WHERE id = $1", [company.rows[0].id]);
  }
});

test("cross-company invoice and contact pages do not disclose records", async (t) => {
  if (!skipUnlessConfigured(t)) return;
  const fixture = `tenant_read_${Date.now()}`;
  const companies = await client.query(
    "INSERT INTO companies (name) VALUES ($1), ($2) RETURNING id",
    [`${fixture}_a`, `${fixture}_b`],
  );
  const user = await client.query(
    "INSERT INTO users (name, email, password, role, status, company_id) VALUES ($1, $2, $3, 'user', 'active', $4) RETURNING id",
    ["Tenant Reader", `${fixture}@security-test.invalid`, "not-a-password", companies.rows[0].id],
  );
  const contact = await client.query(
    "INSERT INTO contacts (name, email, phone, address, tax_id, company_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
    ["Private Tenant Contact", `${fixture}@private.invalid`, "00000000", "Private address", "private-tax-id", companies.rows[1].id],
  );
  const invoice = await client.query(
    "INSERT INTO invoices (invoice_number, issue_date, contact_id, net_amount, company_id) VALUES ($1, CURRENT_DATE, $2, 1, $3) RETURNING id",
    [`${fixture}_invoice`, contact.rows[0].id, companies.rows[1].id],
  );
  const expense = await client.query(
    "INSERT INTO expenses (expense_number, title, contact_id, amount, expense_date, company_id) VALUES ($1, $2, $3, 1, CURRENT_DATE, $4) RETURNING id",
    [`${fixture}_expense`, "Private expense", contact.rows[0].id, companies.rows[1].id],
  );

  try {
    const token = await tokenFor("user", String(user.rows[0].id));
    const invoiceResponse = await request(`/invoices/preview/${invoice.rows[0].id}`, { token });
    assert.equal(invoiceResponse.status, 404, "cross-company invoice preview should be hidden");
    const editInvoiceResponse = await request(`/invoices/edit/${invoice.rows[0].id}`, { token });
    assert.equal(editInvoiceResponse.status, 404, "cross-company invoice edit should be hidden");
    const whtInvoiceResponse = await request(`/invoices/wht50/${invoice.rows[0].id}`, { token });
    assert.equal(whtInvoiceResponse.status, 404, "cross-company withholding document should be hidden");
    const expenseResponse = await request(`/expenses/${expense.rows[0].id}/wht53`, { token });
    assert.equal(expenseResponse.status, 404, "cross-company expense withholding document should be hidden");

    const contactResponse = await request(`/contacts/edit/${contact.rows[0].id}`, { token });
    const contactBody = await contactResponse.text();
    assert.ok(
      !contactBody.includes(`${fixture}@private.invalid`) &&
        !contactBody.includes("Private address") &&
        !contactBody.includes("private-tax-id"),
      "cross-company contact data must not be rendered",
    );
  } finally {
    await client.query("DELETE FROM invoices WHERE id = $1", [invoice.rows[0].id]);
    await client.query("DELETE FROM expenses WHERE id = $1", [expense.rows[0].id]);
    await client.query("DELETE FROM contacts WHERE id = $1", [contact.rows[0].id]);
    await client.query("DELETE FROM users WHERE id = $1", [user.rows[0].id]);
    await client.query("DELETE FROM companies WHERE id = $1 OR id = $2", [
      companies.rows[0].id,
      companies.rows[1].id,
    ]);
  }
});

test("company API scopes data and omits bank and OAuth credentials", async (t) => {
  if (!skipUnlessConfigured(t)) return;
  const fixture = `company_settings_${Date.now()}`;
  const company = await client.query(
    "INSERT INTO companies (name) VALUES ($1) RETURNING id",
    [fixture],
  );
  const user = await client.query(
    "INSERT INTO users (name, email, password, role, status, company_id) VALUES ($1, $2, $3, 'user', 'active', $4) RETURNING id",
    ["Settings Reader", `${fixture}@security-test.invalid`, "not-a-password", company.rows[0].id],
  );
  await client.query(
    `INSERT INTO company_settings (company_id, name, bank_account_number, google_client_secret, google_refresh_token)
     VALUES ($1, $2, $3, $4, $5)`,
    [company.rows[0].id, fixture, `${fixture}_bank`, `${fixture}_secret`, `${fixture}_refresh`],
  );

  try {
    const token = await tokenFor("user", String(user.rows[0].id));
    const response = await request("/api/company", { token });
    assert.equal(response.status, 200);
    const body = await response.text();
    assert.ok(!body.includes(`${fixture}_bank`));
    assert.ok(!body.includes(`${fixture}_secret`));
    assert.ok(!body.includes(`${fixture}_refresh`));
    const updateResponse = await request("/api/company/update", {
      method: "POST",
      token,
    });
    assert.equal(updateResponse.status, 403, "regular users must not update company settings");
    const settingsApiResponse = await request("/api/settings", {
      method: "PUT",
      token,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `${fixture}_modified` }),
    });
    assert.equal(settingsApiResponse.status, 403, "regular users must not update settings through the JSON API");
    const settingsPage = await request("/settings", { token });
    const settingsBody = await settingsPage.text();
    assert.ok(!settingsBody.includes(`${fixture}_secret`));
    assert.ok(!settingsBody.includes(`${fixture}_refresh`));
  } finally {
    await client.query("DELETE FROM users WHERE id = $1", [user.rows[0].id]);
    await client.query("DELETE FROM companies WHERE id = $1", [company.rows[0].id]);
  }
});
function base32DecodeForTotp(input) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  const output = [];
  for (const char of input.toUpperCase().replace(/=+$/g, "").replace(/\s+/g, "")) {
    const index = alphabet.indexOf(char);
    if (index < 0) throw new Error("invalid base32");
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

function totpForTest(secret, timeMs = Date.now()) {
  const counter = BigInt(Math.floor(timeMs / 1000 / 30));
  const counterBuffer = Buffer.alloc(8);
  let remaining = counter;
  for (let i = 7; i >= 0; i--) {
    counterBuffer[i] = Number(remaining & BigInt(255));
    remaining >>= BigInt(8);
  }
  const hmac = createHmac("sha1", base32DecodeForTotp(secret)).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(binary % 1000000).padStart(6, "0");
}

test("two-factor authentication can be enrolled and used for login", async (t) => {
  if (!skipUnlessConfigured(t)) return;
  const fixture = `twofa_${Date.now()}`;
  const company = await client.query(
    "INSERT INTO companies (name) VALUES ($1) RETURNING id",
    [fixture],
  );
  const user = await client.query(
    `INSERT INTO users (name, email, password, role, status, company_id)
     VALUES ($1, $2, $3, 'user', 'active', $4) RETURNING id`,
    ["2FA Test User", `${fixture}@security-test.invalid`, "$2b$10$/XAEkKyJGBD5WDPMF.ahDe1MdRvZ0YqwRAyQxMCrh2Q2KbKWn2hjS", company.rows[0].id],
  );
  const userId = user.rows[0].id;
  const email = `${fixture}@security-test.invalid`;

  try {
    const loginResponse = await fetch(new URL("/api/login", baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "password123" }),
    });
    assert.equal(loginResponse.status, 200);
    const loginCookie = loginResponse.headers.get("set-cookie")?.split(";")[0];
    assert.ok(loginCookie);

    const setupResponse = await fetch(new URL("/api/auth/2fa/setup", baseUrl), {
      method: "POST",
      headers: { Cookie: loginCookie },
    });
    assert.equal(setupResponse.status, 200);
    const setupBody = await setupResponse.json();
    assert.ok(setupBody.secret);
    assert.ok(setupBody.otpauthUri);

    const enableResponse = await fetch(new URL("/api/auth/2fa/enable", baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: loginCookie },
      body: JSON.stringify({ code: totpForTest(setupBody.secret) }),
    });
    assert.equal(enableResponse.status, 200);
    const enableBody = await enableResponse.json();
    assert.equal(enableBody.recoveryCodes.length, 10);

    const secondLoginResponse = await fetch(new URL("/api/login", baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "password123" }),
    });
    assert.equal(secondLoginResponse.status, 200);
    const secondLoginBody = await secondLoginResponse.json();
    assert.equal(secondLoginBody.requires2FA, true);
    assert.ok(secondLoginBody.pendingToken);

    const verifyResponse = await fetch(new URL("/api/auth/2fa/verify-login", baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pendingToken: secondLoginBody.pendingToken, code: totpForTest(setupBody.secret) }),
    });
    assert.equal(verifyResponse.status, 200);
    assert.ok(verifyResponse.headers.get("set-cookie")?.includes("session-token="));
  } finally {
    await client.query("DELETE FROM user_recovery_codes WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM users WHERE id = $1", [userId]);
    await client.query("DELETE FROM companies WHERE id = $1", [company.rows[0].id]);
  }
});
