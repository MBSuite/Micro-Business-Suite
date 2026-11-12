import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Encryption for support-channel credentials (LINE channel secret / access token).
 *
 * Mirrors lib/google-token-crypto.ts but uses its own key so the two secrets can be
 * rotated independently. The key must be a base64-encoded 32-byte value:
 *
 *   openssl rand -base64 32
 *
 * Only Core stores provider credentials. Module apps never need this key.
 */

const TOKEN_PREFIX = "enc:v1:";

function getEncryptionKey(): Buffer {
  const configuredKey = process.env.SUPPORT_TOKEN_ENCRYPTION_KEY;
  if (!configuredKey) {
    throw new Error("SUPPORT_TOKEN_ENCRYPTION_KEY is not configured");
  }

  const key = Buffer.from(configuredKey, "base64");
  if (
    key.length !== 32 ||
    key.toString("base64").replace(/=+$/, "") !== configuredKey.replace(/=+$/, "")
  ) {
    throw new Error("SUPPORT_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key");
  }
  return key;
}

export function isEncryptedSupportSecret(value: string): boolean {
  return value.startsWith(TOKEN_PREFIX);
}

export function encryptSupportSecret(plainText: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${TOKEN_PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${ciphertext.toString("base64")}`;
}

export function decryptSupportSecret(value: string): string {
  if (!value.startsWith(TOKEN_PREFIX)) {
    throw new Error("Support credential is not encrypted (expected enc:v1: prefix)");
  }

  const [ivValue, tagValue, ciphertextValue] = value.slice(TOKEN_PREFIX.length).split(":");
  if (!ivValue || !tagValue || !ciphertextValue) {
    throw new Error("Stored support credential has an invalid encrypted format");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivValue, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
