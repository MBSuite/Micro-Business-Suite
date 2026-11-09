import test, { after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { SignJWT } from "jose";
import { registerUser } from "../app/register/actions";
import { PLUGIN_PACKS } from "../lib/plugin-packs";
import pool from "../lib/db";

const databaseUrl = process.env.MBS_TEST_DATABASE_URL;
const parsedDatabaseUrl = databaseUrl ? new URL(databaseUrl) : null;

test("Rental and Hotel registration create isolated trial tenants with their packs", async () => {
  assert.equal(process.env.MBS_RUN_REGISTRATION_INTEGRATION, "1");
  assert.ok(parsedDatabaseUrl, "MBS_TEST_DATABASE_URL is required");
  assert.equal(process.env.DATABASE_URL, databaseUrl, "registration must use the isolated test database");
  assert.equal(parsedDatabaseUrl.hostname, "127.0.0.1");
  assert.equal(parsedDatabaseUrl.port, "54329");
  assert.equal(parsedDatabaseUrl.pathname, "/mbs_test");
  assert.ok(process.env.MBS_TEST_BASE_URL, "MBS_TEST_BASE_URL is required");
  assert.ok(process.env.MBS_TEST_JWT_SECRET, "MBS_TEST_JWT_SECRET is required");

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  const adminCompany = await client.query(
    "INSERT INTO companies (name) VALUES ($1) RETURNING id",
    [`Registration Admin ${randomUUID()}`]
  );
  const admin = await client.query(
    `INSERT INTO users (name, email, password, role, status, company_id)
     VALUES ($1, $2, $3, 'superadmin', 'Active', $4)
     RETURNING id`,
    ["Registration Test Admin", `registration-admin-${randomUUID()}@test.invalid`, "unused", adminCompany.rows[0].id]
  );
  const adminToken = await new SignJWT({
    id: String(admin.rows[0].id),
    email: "registration-admin@test.invalid",
    name: "Registration Test Admin",
    role: "superadmin",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(new TextEncoder().encode(process.env.MBS_TEST_JWT_SECRET));

  try {
    for (const [businessType, packId] of [
      ["rental", "rental"],
      ["hotel", "hotel_booking"],
    ] as const) {
      const suffix = randomUUID();
      const name = `Registration Test ${businessType} ${suffix}`;
      const email = `${businessType}-${suffix}@registration-test.invalid`;
      const formData = new FormData();
      formData.set("name", name);
      formData.set("email", email);
      formData.set("password", "test-password-only");
      formData.set("confirmPassword", "test-password-only");
      formData.set("companyName", name);
      formData.set("businessType", businessType);

      try {
        const result = await registerUser(formData);
        assert.equal(result.error, undefined, `${businessType} registration should succeed`);
        assert.ok(result.company?.id, "registration should return the created company");

        const companyResult = await client.query(
          "SELECT business_type, plan_type FROM companies WHERE id = $1",
          [result.company.id]
        );
        assert.deepEqual(companyResult.rows[0], {
          business_type: businessType,
          plan_type: "TRIAL",
        });

        const userResult = await client.query(
          "SELECT id, email, status FROM users WHERE company_id = $1",
          [result.company.id]
        );
        assert.deepEqual(userResult.rows.map(({ email: userEmail, status }) => ({ email: userEmail, status })), [
          { email, status: "Active" },
        ]);

        const expectedModules = [...PLUGIN_PACKS[packId].modules].sort();
        const moduleResult = await client.query(
          "SELECT module_id FROM company_module_settings WHERE company_id = $1 AND is_enabled = TRUE ORDER BY module_id",
          [result.company.id]
        );
        assert.deepEqual(moduleResult.rows.map((row) => row.module_id), expectedModules);

        const deleteResponse: Response = await fetch(
          `${process.env.MBS_TEST_BASE_URL}/api/users/${userResult.rows[0].id}`,
          {
            method: "DELETE",
            headers: { Cookie: `session-token=${adminToken}` },
          }
        );
        assert.equal(deleteResponse.status, 200, "admin should delete the registered member through the API");
        assert.deepEqual(await deleteResponse.json(), {
          success: true,
          deletedUserId: userResult.rows[0].id,
        });
        const remainingUser = await client.query(
          "SELECT id FROM users WHERE id = $1",
          [userResult.rows[0].id]
        );
        assert.equal(remainingUser.rowCount, 0, "deleted member should no longer exist");
      } finally {
        await client.query(
          "DELETE FROM users WHERE company_id IN (SELECT id FROM companies WHERE name = $1)",
          [name]
        );
        await client.query("DELETE FROM companies WHERE name = $1", [name]);
      }
    }
  } finally {
    await client.query("DELETE FROM users WHERE id = $1", [admin.rows[0].id]);
    await client.query("DELETE FROM companies WHERE id = $1", [adminCompany.rows[0].id]);
    await client.end();
  }
});

test("module signup API creates each module account in the Core database", async () => {
  assert.equal(process.env.MBS_RUN_REGISTRATION_INTEGRATION, "1");
  assert.ok(parsedDatabaseUrl);
  assert.equal(process.env.DATABASE_URL, databaseUrl);
  assert.ok(process.env.MBS_TEST_BASE_URL);

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  const cases = [
    ["https://micro-business-service.vercel.app", "service"],
    ["https://micro-business-retail.vercel.app", "retail"],
    ["https://micro-business-rental.vercel.app", "rental"],
    ["https://micro-business-pharmacy.vercel.app", "pharmacy"],
    ["https://micro-business-hotel.vercel.app", "hotel"],
    ["https://micro-business-fnb.vercel.app", "fnb"],
  ] as const;
  const createdCompanyNames: string[] = [];

  try {
    for (const [origin, businessType] of cases) {
      const suffix = randomUUID();
      const companyName = `Module Signup ${businessType} ${suffix}`;
      const email = `module-${businessType}-${suffix}@registration-test.invalid`;
      createdCompanyNames.push(companyName);

      const signupResponse: Response = await fetch(`${process.env.MBS_TEST_BASE_URL}/api/register`, {
        method: "POST",
        headers: {
          Origin: origin,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `Module Signup ${businessType}`,
          email,
          password: "test-password-only",
          confirmPassword: "test-password-only",
          companyName,
          businessType: "general",
        }),
      });

      assert.equal(signupResponse.status, 200, `${businessType} signup should succeed`);
      assert.equal(signupResponse.headers.get("access-control-allow-origin"), origin);
      assert.deepEqual(await signupResponse.json(), { success: true, message: "ลงทะเบียนสำเร็จ" });

      const result = await client.query(
        `SELECT c.business_type, c.plan_type, u.email
         FROM companies c
         JOIN users u ON u.company_id = c.id
         WHERE c.name = $1`,
        [companyName]
      );
      assert.deepEqual(result.rows, [{ business_type: businessType, plan_type: "TRIAL", email }]);
    }

    const rejectedResponse: Response = await fetch(`${process.env.MBS_TEST_BASE_URL}/api/register`, {
      method: "POST",
      headers: {
        Origin: "https://malicious.example",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Rejected Signup",
        email: `rejected-${randomUUID()}@registration-test.invalid`,
        password: "test-password-only",
        confirmPassword: "test-password-only",
        companyName: "Rejected Signup",
        businessType: "general",
      }),
    });
    assert.equal(rejectedResponse.status, 403, "unknown browser origins must be rejected");
  } finally {
    await client.query(
      "DELETE FROM users WHERE company_id IN (SELECT id FROM companies WHERE name = ANY($1::text[]))",
      [createdCompanyNames]
    );
    await client.query("DELETE FROM companies WHERE name = ANY($1::text[])", [createdCompanyNames]);
    await client.end();
  }
});

after(async () => {
  await pool.end();
});
