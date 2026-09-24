// =====================================================
// Micro Business Suite: Offline Signed License
// License key = MBS.<base64url(payload)>.<base64url(HMAC-SHA256)>
// Signed by the issuer (seller) using LICENSE_SALT.
// Verified locally at runtime — no central server needed.
// =====================================================

import crypto from "node:crypto";
import { getProductMode } from "./product-mode";

export type LicenseType = "TRIAL" | "STANDARD" | "PROFESSIONAL" | "ENTERPRISE";
export type LicenseMode = "perpetual" | "subscription";

export interface LicensePayload {
  product: "micro-business-suite";
  mode: LicenseMode;
  license_type: LicenseType;
  licensee: string;
  company: string;
  issued_at: string;
  expires_at?: string;
  max_users: number;
  max_transactions_per_month: number;
  allowed_features: string[];
}

export interface LicenseVerifyResult {
  valid: boolean;
  payload?: LicensePayload;
  error?: string;
}

const KEY_VERSION = "MBS";

function getSigningSalt(): string {
  const salt = process.env.LICENSE_SALT;
  if (!salt) {
    throw new Error(
      "FATAL: LICENSE_SALT is not configured. Set LICENSE_SALT to a long random secret " +
      "to secure offline license verification."
    );
  }
  return salt;
}

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function base64UrlDecode(input: string): Buffer {
  return Buffer.from(input, "base64url");
}

function hmacSignature(payloadB64: string, salt: string): string {
  return crypto.createHmac("sha256", salt).update(payloadB64).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function nowIso(): string {
  return new Date().toISOString();
}

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() < Date.now();
}

// Build a signed license key from a payload and salt (used by scripts/issue-license.mjs)
export function createLicenseKey(payload: LicensePayload, salt: string): string {
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const sig = hmacSignature(payloadB64, salt);
  return `${KEY_VERSION}.${payloadB64}.${sig}`;
}

// Parse a license key into its payload (signature NOT verified here)
export function parseLicenseKey(key: string): LicensePayload | null {
  try {
    const parts = key.split(".");
    if (parts.length !== 3 || parts[0] !== KEY_VERSION) return null;
    const parsed = JSON.parse(base64UrlDecode(parts[1]).toString("utf8"));
    if (parsed?.product !== "micro-business-suite") return null;
    return parsed as LicensePayload;
  } catch {
    return null;
  }
}

// Verify the license payload shape; ensures a signed-but-malformed key
// (e.g. bad enum, NaN limits, invalid date) never counts as valid.
function isDateString(v: unknown): v is string {
  if (typeof v !== "string" || v.length === 0) return false;
  return !isNaN(new Date(v).getTime());
}

const LICENSE_TYPES = ["TRIAL", "STANDARD", "PROFESSIONAL", "ENTERPRISE"] as const;
const LICENSE_MODES = ["perpetual", "subscription"] as const;

export function validateLicensePayload(payload: Record<string, unknown>): {
  ok: true;
} | { ok: false; error: string } {
  // Field ตาม LicensePayload interface: mode/license_type/max_users/
  // max_transactions_per_month/licensee/company/issued_at/allowed_features เป็น required
  // (เฉพาะ expires_at ที่ optional) — payload เซ็นถูกแต่ขาด field สำคัญ ต้องไม่ผ่าน
  const mode = payload.mode as LicenseMode | undefined;
  if (mode === undefined || !LICENSE_MODES.includes(mode)) {
    return { ok: false, error: "License payload must include a valid mode" };
  }
  const licenseType = payload.license_type as LicenseType | undefined;
  if (licenseType === undefined || !LICENSE_TYPES.includes(licenseType)) {
    return { ok: false, error: "License payload must include a valid license_type" };
  }
  if (typeof payload.licensee !== "string" || payload.licensee.length === 0) {
    return { ok: false, error: "License payload must include a licensee" };
  }
  if (typeof payload.company !== "string" || payload.company.length === 0) {
    return { ok: false, error: "License payload must include a company" };
  }
  if (typeof payload.issued_at !== "string" || !isDateString(payload.issued_at)) {
    return { ok: false, error: "License payload must include a valid issued_at" };
  }
  if (typeof payload.max_users !== "number" || payload.max_users < 1) {
    return { ok: false, error: "License payload must include max_users as a positive number" };
  }
  if (
    typeof payload.max_transactions_per_month !== "number" ||
    payload.max_transactions_per_month < 1
  ) {
    return { ok: false, error: "License payload must include max_transactions_per_month as a positive number" };
  }
  if (!Array.isArray(payload.allowed_features)) {
    return { ok: false, error: "License payload must include allowed_features as an array" };
  }
  if (payload.expires_at !== undefined && !isDateString(payload.expires_at)) {
    return { ok: false, error: "License expiry date is malformed" };
  }
  return { ok: true };
}

// Fully verify a license key: signature + payload shape + expiry
export function verifyLicenseKey(key: string, salt: string): LicenseVerifyResult {
  const parts = key.split(".");
  if (parts.length !== 3 || parts[0] !== KEY_VERSION) {
    return { valid: false, error: "Invalid license key format" };
  }

  const [version, payloadB64, sig] = parts;

  const expectedSig = hmacSignature(payloadB64, salt);
  if (!safeEqual(sig, expectedSig)) {
    return { valid: false, error: "License signature verification failed" };
  }

  const payload = parseLicenseKey(`${version}.${payloadB64}.${sig}`);
  if (!payload) {
    return { valid: false, error: "License payload is malformed" };
  }

  const shape = validateLicensePayload(payload as unknown as Record<string, unknown>);
  if (!shape.ok) {
    return { valid: false, error: shape.error };
  }

  if (payload.expires_at && isExpired(payload.expires_at)) {
    return { valid: false, error: `License expired on ${payload.expires_at}` };
  }

  if (payload.mode === "subscription" && getProductMode() === "perpetual") {
    return { valid: false, error: "Subscription license cannot be used in perpetual mode" };
  }

  if (getProductMode() === "subscription" && !payload.expires_at) {
    return { valid: false, error: "Subscription product requires a license with an expiry date" };
  }

  return { valid: true, payload };
}

// Verify the configured MBS_LICENSE_KEY against LICENSE_SALT
export function verifyConfiguredLicense(): LicenseVerifyResult {
  const salt = getSigningSalt();
  const key = process.env.MBS_LICENSE_KEY?.trim();
  if (!key) {
    return { valid: false, error: "MBS_LICENSE_KEY is not configured" };
  }
  return verifyLicenseKey(key, salt);
}

// Fail fast if the configured license is missing / invalid / expired.
// Call at server startup (instrumentation.register) — production ships only with a valid key.
export function requireActiveLicense(): LicensePayload {
  const result = verifyConfiguredLicense();
  if (!result.valid || !result.payload) {
    throw new Error(
      `License check failed: ${result.error}. ` +
      "Run scripts/issue-license.mjs to issue a key and set it as MBS_LICENSE_KEY."
    );
  }
  return result.payload;
}

export function isLicenseValid(): boolean {
  try {
    return verifyConfiguredLicense().valid;
  } catch {
    return false;
  }
}

export { nowIso, getSigningSalt };