// Integration regression tests สำหรับการแก้ไขด้านความปลอดภัยที่ตรวจพบจาก SECURITY.md
// รันได้เฉพาะเมื่อตั้ง MBS_TEST_* ให้ชี้ไปยังฐานข้อมูล disposable เท่านั้น
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { Client } from "pg";
import { SignJWT } from "jose";

const baseUrl = process.env.MBS_TEST_BASE_URL;
const databaseUrl = process.env.MBS_TEST_DATABASE_URL;
const jwtSecret = process.env.MBS_TEST_JWT_SECRET;
const productionUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const enabled = Boolean(baseUrl && databaseUrl && jwtSecret);
const bridgeToken = process.env.MBS_BRIDGE_TOKEN || "";

let client;

function skipUnlessConfigured(t) {
  if (!enabled || !bridgeToken) {
    t.skip("ต้องตั้ง MBS_TEST_BASE_URL, MBS_TEST_DATABASE_URL, MBS_TEST_JWT_SECRET และ MBS_BRIDGE_TOKEN");
    return false;
  }
  return true;
}

async function sessionToken(user, issuedAt) {
  const builder = new SignJWT({ id: String(user.id), email: user.email, name: user.name, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("10m");
  if (issuedAt) builder.setIssuedAt(issuedAt);
  else builder.setIssuedAt();
  return builder.sign(new TextEncoder().encode(jwtSecret));
}

async function request(path, { method = "GET", token, bearer, body } = {}) {
  const headers = new Headers();
  if (token) headers.set("Cookie", `session-token=${token}`);
  if (bearer) headers.set("Authorization", `Bearer ${bearer}`);
  if (body !== undefined) headers.set("Content-Type", "application/json");
  return fetch(new URL(path, baseUrl), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: "manual",
  });
}

async function createCompany(name) {
  const { rows } = await client.query("INSERT INTO companies (name) VALUES ($1) RETURNING id", [name]);
  return rows[0].id;
}

async function createUser(name, email, role, companyId) {
  const { rows } = await client.query(
    `INSERT INTO users (name, email, password, role, status, company_id)
     VALUES ($1, $2, $3, $4, 'active', $5) RETURNING id`,
    [name, email, "$2b$10$/XAEkKyJGBD5WDPMF.ahDe1MdRvZ0YqwRAyQxMCrh2Q2KbKWn2hjS", role, companyId]
  );
  return { id: rows[0].id, name, email, role };
}

before(async () => {
  if (!enabled) return;
  assert.notEqual(databaseUrl, productionUrl, "MBS_TEST_DATABASE_URL ต้องไม่ใช่ production");
  client = new Client({ connectionString: databaseUrl });
  await client.connect();
});

after(async () => {
  if (client) await client.end();
});

test("DELETE payment ลบเฉพาะ journal ของ tenant ที่ถูกต้อง", async (t) => {
  if (!skipUnlessConfigured(t)) return;
  const suffix = `payjournal_${Date.now()}`;
  const companyA = await createCompany(`${suffix}_a`);
  const companyB = await createCompany(`${suffix}_b`);
  const userA = await createUser("Owner A", `${suffix}@a.invalid`, "admin", companyA);

  try {
    const invoice = await client.query(
      `INSERT INTO invoices (invoice_number, issue_date, net_amount, company_id)
       VALUES ($1, CURRENT_DATE, 100, $2) RETURNING id`,
      [`INV-${suffix}`, companyA]
    );
    const payment = await client.query(
      `INSERT INTO payments (payment_no, invoice_id, amount, payment_date, company_id)
       VALUES ($1, $2, 100, CURRENT_DATE, $3) RETURNING id`,
      [`RC-${suffix}`, invoice.rows[0].id, companyA]
    );
    const paymentId = payment.rows[0].id;

    // จำลอง reference_id ซ้ำข้าม tenant — ต้องไม่ถูกลบตาม payment ของบริษัทอื่น
    await client.query(
      `INSERT INTO journal_entries (company_id, reference_type, reference_id, reference_no, amount)
       VALUES ($1, 'receipt', $2, $3, 100), ($4, 'receipt', $2, $3, 100)`,
      [companyA, paymentId, `RC-${suffix}`, companyB]
    );

    const response = await request(`/api/payments/${paymentId}`, {
      method: "DELETE",
      token: await sessionToken(userA),
    });
    assert.equal(response.status, 200);

    const remaining = await client.query(
      `SELECT company_id FROM journal_entries WHERE reference_type = 'receipt' AND reference_id = $1`,
      [paymentId]
    );
    assert.deepEqual(remaining.rows.map((r) => r.company_id), [companyB]);
  } finally {
    await client.query("DELETE FROM journal_entries WHERE reference_no = $1", [`RC-${suffix}`]);
    await client.query("DELETE FROM payments WHERE payment_no = $1", [`RC-${suffix}`]);
    await client.query("DELETE FROM invoices WHERE invoice_number = $1", [`INV-${suffix}`]);
    await client.query("DELETE FROM users WHERE email = $1", [`${suffix}@a.invalid`]);
    await client.query("DELETE FROM companies WHERE id IN ($1, $2)", [companyA, companyB]);
  }
});

test("Bridge idempotency key ใช้ซ้ำข้ามบริษัทได้", async (t) => {
  if (!skipUnlessConfigured(t)) return;
  const suffix = `bridge_${Date.now()}`;
  const key = `${suffix}-key`;
  const companyA = await createCompany(`${suffix}_a`);
  const companyB = await createCompany(`${suffix}_b`);

  try {
    // invoice_number เป็น UNIQUE ทั้งตาราง → ให้แต่ละบริษัทมี prefix ต่างกัน
    // เพื่อให้ทดสอบโฟกัสที่ idempotency scope ไม่ใช่เลขใบแจ้งหนี้ซ้ำกัน
    const tag = Date.now().toString(36).toUpperCase();
    await client.query(
      `INSERT INTO company_settings (company_id, invoice_prefix) VALUES ($1, $2), ($3, $4)`,
      [companyA, `A${tag}`, companyB, `B${tag}`]
    );

    const body = {
      event: "order.paid",
      idempotency_key: key,
      data: { order_id: suffix, items: [{ qty: 1, price: 100, product_name: "item" }] },
    };
    const first = await request("/api/bridge/sync", {
      method: "POST",
      bearer: bridgeToken,
      body: { ...body, company_id: companyA },
    });
    const second = await request("/api/bridge/sync", {
      method: "POST",
      bearer: bridgeToken,
      body: { ...body, company_id: companyB },
    });
    assert.equal(first.status, 200, await first.text());
    assert.equal(second.status, 200, await second.text());

    const rows = await client.query(
      `SELECT company_id FROM bridge_sync_log WHERE idempotency_key = $1 AND status = 'success'`,
      [key]
    );
    assert.deepEqual(rows.rows.map((r) => r.company_id).sort((a, b) => a - b), [companyA, companyB]);
  } finally {
    await client.query("DELETE FROM bridge_sync_log WHERE idempotency_key = $1", [key]);
    await client.query("DELETE FROM companies WHERE id IN ($1, $2)", [companyA, companyB]);
  }
});

test("reset token ใช้ได้ครั้งเดียว และ session เก่าใช้ไม่ได้หลังเปลี่ยนรหัสผ่าน", async (t) => {
  if (!skipUnlessConfigured(t)) return;
  const suffix = `reset_${Date.now()}`;
  const email = `${suffix}@reset.invalid`;
  const companyId = await createCompany(suffix);
  const user = await createUser("Reset User", email, "user", companyId);
  // ออกโทเค็นเก่าให้ชัดเจนว่าก่อน reset (ไม่พึ่งเวลารันที่อาจอยู่ในวินาทีเดียวกัน)
  const oldSession = await sessionToken(user, new Date(Date.now() - 60 * 60 * 1000));

  try {
    const forgot = await request("/api/auth/forgot-password", {
      method: "POST",
      body: { email },
    });
    assert.equal(forgot.status, 200);

    const ledger = await client.query(
      "SELECT jti FROM password_reset_tokens WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
      [user.id]
    );
    assert.equal(ledger.rows.length, 1, "ต้องมี jti ใน ledger");

    const resetToken = await new SignJWT({
      sub: String(user.id),
      email,
      purpose: "password-reset",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .setJti(ledger.rows[0].jti)
      .sign(new TextEncoder().encode(jwtSecret));

    const first = await request("/api/auth/reset-password", {
      method: "POST",
      body: { token: resetToken, password: "newPass123", confirmPassword: "newPass123" },
    });
    assert.equal(first.status, 200, await first.text());

    const replay = await request("/api/auth/reset-password", {
      method: "POST",
      body: { token: resetToken, password: "newPass123", confirmPassword: "newPass123" },
    });
    assert.equal(replay.status, 400, "token ต้องใช้ซ้ำไม่ได้");

    const oldSessionResponse = await request("/api/payments", { token: oldSession });
    assert.equal(oldSessionResponse.status, 401, "session ที่ออกก่อน reset ต้องถูกเพิกถอน");

    // session ที่ออกใหม่หลัง reset ต้องใช้ได้ — กัน lockout จากความคลาดเคลื่อน
    // ระหว่าง JWT iat (วินาที) กับ password_changed_at (มิลลิวินาที)
    const relogin = await request("/api/login", {
      method: "POST",
      body: { email, password: "newPass123" },
    });
    assert.equal(relogin.status, 200, await relogin.text());
    const newToken = (relogin.headers.get("set-cookie") || "").match(/session-token=([^;]+)/)?.[1];
    assert.ok(newToken, "ต้องมี session-token หลัง login ใหม่");
    const newSessionResponse = await request("/api/payments", { token: newToken });
    assert.equal(newSessionResponse.status, 200, "session ที่ออกใหม่หลัง reset ต้องใช้ได้");
  } finally {
    await client.query("DELETE FROM password_reset_tokens WHERE user_id = $1", [user.id]);
    await client.query("DELETE FROM users WHERE id = $1", [user.id]);
    await client.query("DELETE FROM companies WHERE id = $1", [companyId]);
  }
});

test("recovery code ของ 2FA ใช้พร้อมกันได้เพียงครั้งเดียว", async (t) => {
  if (!skipUnlessConfigured(t)) return;
  const suffix = `recovery_${Date.now()}`;
  const email = `${suffix}@recovery.invalid`;
  const recoveryCode = "ABCDE-12345";
  const hash = createHash("sha256").update(recoveryCode.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()).digest("hex");
  const companyId = await createCompany(suffix);
  const user = await createUser("Recovery User", email, "user", companyId);

  try {
    await client.query(
      "UPDATE users SET totp_enabled = TRUE, totp_secret = $1 WHERE id = $2",
      ["JBSWY3DPEHPK3PXP", user.id]
    );
    await client.query(
      "INSERT INTO user_recovery_codes (user_id, code_hash) VALUES ($1, $2)",
      [user.id, hash]
    );

    const login = await request("/api/login", {
      method: "POST",
      body: { email, password: "password123" },
    });
    assert.equal(login.status, 200);
    const loginBody = await login.json();
    assert.equal(loginBody.requires2FA, true);
    assert.ok(loginBody.pendingToken);

    const [a, b] = await Promise.all(
      [1, 2].map(() =>
        request("/api/auth/2fa/verify-login", {
          method: "POST",
          body: { pendingToken: loginBody.pendingToken, recoveryCode },
        })
      )
    );
    const statuses = [a.status, b.status].sort();
    assert.deepEqual(statuses, [200, 401], "มีคำขอเดียวที่ผ่านได้");
  } finally {
    await client.query("DELETE FROM user_recovery_codes WHERE user_id = $1", [user.id]);
    await client.query("DELETE FROM users WHERE id = $1", [user.id]);
    await client.query("DELETE FROM companies WHERE id = $1", [companyId]);
  }
});

test("backup ไม่ส่ง secret ออกไปแม้ไม่ได้เข้ารหัส", async (t) => {
  if (!skipUnlessConfigured(t)) return;
  const suffix = `backup_${Date.now()}`;
  const secret = `RD_SECRET_${suffix}`;
  const companyId = await createCompany(suffix);
  const admin = await createUser("Backup Admin", `${suffix}@admin.invalid`, "superadmin", companyId);

  try {
    await client.query(
      `INSERT INTO company_settings (company_id, rd_api_key, google_refresh_token)
       VALUES ($1, $2, $3)
       ON CONFLICT (company_id) WHERE company_id IS NOT NULL
       DO UPDATE SET rd_api_key = EXCLUDED.rd_api_key, google_refresh_token = EXCLUDED.google_refresh_token`,
      [companyId, secret, `REFRESH_${suffix}`]
    );

    const response = await request("/api/admin/backup?format=json", {
      token: await sessionToken(admin),
    });
    assert.equal(response.status, 200);
    const text = await response.text();
    assert.ok(!text.includes(secret), "RD API key ต้องไม่ปรากฏใน backup");
    assert.ok(!text.includes(`REFRESH_${suffix}`), "refresh token ต้องไม่ปรากฏใน backup");
    assert.ok(text.includes("[REDACTED]"));
  } finally {
    await client.query("DELETE FROM company_settings WHERE company_id = $1", [companyId]);
    await client.query("DELETE FROM users WHERE email = $1", [`${suffix}@admin.invalid`]);
    await client.query("DELETE FROM companies WHERE id = $1", [companyId]);
  }
});
