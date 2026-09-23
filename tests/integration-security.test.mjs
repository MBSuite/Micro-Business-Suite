import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { Client } from "pg";

const baseUrl = process.env.MBS_TEST_BASE_URL;
const databaseUrl = process.env.MBS_TEST_DATABASE_URL;
const jwtSecret = process.env.MBS_TEST_JWT_SECRET;
const productionUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const enabled = Boolean(baseUrl && databaseUrl && jwtSecret);

let client;

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

async function tokenFor(role, id = "security-test-user") {
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
});

after(async () => {
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
    ["/api/import", "POST"],
    ["/api/admin/backup", "GET"],
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

test("regular users cannot access admin actions", async (t) => {
  if (!skipUnlessConfigured(t)) return;
  const token = await tokenFor("user");

  await expectStatus("/api/admin/backup?format=json", 403, { token });
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