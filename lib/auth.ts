/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
import { query } from "./db";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

// Enforce JWT secret: MUST be set in environment, no fallback allowed
function getJWTSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "FATAL: JWT secret is not configured. Set NEXTAUTH_SECRET or AUTH_SECRET environment variable. " +
      "This is a security-critical requirement to prevent session forgery."
    );
  }
  return new TextEncoder().encode(secret);
}

const SECRET = getJWTSecret();

export type UserSession = {
  id: string;
  email: string;
  name?: string;
  role?: string;
};

type LicenseCheckResult = {
  allowed: boolean;
  companyId: number;
  planType: string;
  maxUsers: number;
  currentUsers: number;
  subscriptionStatus: string;
  expiryDate: string | null;
};

async function ensureCompanyLicensingSchema() {
  // Schema is created by migrations (scripts/bootstrap-init-db.mjs). Runtime only verifies it.
  const { rows: schemaRows } = await query(`
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'companies' LIMIT 1
  `);
  if (schemaRows.length === 0) {
    throw new Error(
      "Schema 'companies' is missing. Run database bootstrap (scripts/bootstrap-init-db.mjs) before using this feature."
    );
  }
  const { rows: columnRows } = await query(`
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'company_id' LIMIT 1
  `);
  if (columnRows.length === 0) {
    throw new Error(
      "Column 'users.company_id' is missing. Run database bootstrap (scripts/bootstrap-init-db.mjs) before using this feature."
    );
  }

  const companyCountRes = await query(`SELECT COUNT(*)::int AS count FROM companies`);
  if (Number(companyCountRes.rows[0]?.count || 0) === 0) {
    const settingsRes = await query(`SELECT name FROM company_settings LIMIT 1`).catch(() => ({ rows: [] }));
    const defaultCompanyName = settingsRes.rows[0]?.name || "Your Company";

    const companyRes = await query(
      `
        INSERT INTO companies (name, plan_type, max_users, subscription_status, expiry_date)
        VALUES ($1, 'FREE', 1, 'Active', NULL)
        RETURNING id, name
      `,
      [defaultCompanyName]
    );
    await query(
      "INSERT INTO company_settings (company_id, name) VALUES ($1, $2) ON CONFLICT (company_id) WHERE company_id IS NOT NULL DO NOTHING",
      [companyRes.rows[0].id, companyRes.rows[0].name]
    );
  }

  const defaultCompanyRes = await query(`SELECT id FROM companies ORDER BY id ASC LIMIT 1`);
  const defaultCompanyId = Number(defaultCompanyRes.rows[0]?.id || 1);

  // NOTE: backfilling users.company_id is intentionally NOT done at runtime.
  // It is handled by migration scripts/add_users_company_id_backfill.sql so that
  // user-to-company mapping is reviewed and applied explicitly (see AGENTS.md).
  return defaultCompanyId;
}

export async function getDefaultCompanyId() {
  return ensureCompanyLicensingSchema();
}

export async function getUserCompanyId(userId?: string | number | null) {
  const defaultCompanyId = await ensureCompanyLicensingSchema();
  if (!userId) return defaultCompanyId;

  const userRes = await query(`SELECT company_id FROM users WHERE id = $1 LIMIT 1`, [userId]);
  return Number(userRes.rows[0]?.company_id || defaultCompanyId);
}

export async function checkUserLimit(company_id?: string | number | null): Promise<LicenseCheckResult> {
  const defaultCompanyId = await ensureCompanyLicensingSchema();
  const resolvedCompanyId = Number(company_id || defaultCompanyId);

  const companyRes = await query(
    `
      SELECT
        id,
        plan_type,
        max_users,
        subscription_status,
        expiry_date
      FROM companies
      WHERE id = $1
      LIMIT 1
    `,
    [resolvedCompanyId]
  );

  const company = companyRes.rows[0] || {
    id: resolvedCompanyId,
    plan_type: "FREE",
    max_users: 1,
    subscription_status: "Active",
    expiry_date: null,
  };

  const usersRes = await query(
    `SELECT COUNT(*)::int AS count FROM users WHERE company_id = $1`,
    [resolvedCompanyId]
  );

  const currentUsers = Number(usersRes.rows[0]?.count || 0);
  const maxUsers = Number(company.max_users || 1);
  const subscriptionStatus = String(company.subscription_status || "Active");
  const expiryDate = company.expiry_date ? new Date(company.expiry_date).toISOString() : null;
  const isExpired = expiryDate ? new Date(expiryDate).getTime() < Date.now() : false;
  const allowed = subscriptionStatus.toLowerCase() === "active" && !isExpired && currentUsers < maxUsers;

  return {
    allowed,
    companyId: resolvedCompanyId,
    planType: String(company.plan_type || "FREE"),
    maxUsers,
    currentUsers,
    subscriptionStatus,
    expiryDate,
  };
}

// Verify JWT token and return session
export async function verifyToken(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

// Get session from cookie (returns { user: ... } format like next-auth)
export async function auth(): Promise<{ user: UserSession } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session-token")?.value;
  if (!token) return null;
  const session = await verifyToken(token);
  if (!session) return null;
  return { user: session };
}

// Create JWT token
export async function createToken(user: UserSession): Promise<string> {
  return new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(SECRET);
}
