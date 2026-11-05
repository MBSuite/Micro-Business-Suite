import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const TOKEN_PREFIX = "enc:v1:";

function getEncryptionKey() {
  const configuredKey = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
  if (!configuredKey) throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY is not configured");

  const key = Buffer.from(configuredKey, "base64");
  if (key.length !== 32 || key.toString("base64").replace(/=+$/, "") !== configuredKey.replace(/=+$/, "")) {
    throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key");
  }
  return key;
}

export function encryptGoogleRefreshToken(token: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${TOKEN_PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${ciphertext.toString("base64")}`;
}

export function decryptGoogleRefreshToken(value: string) {
  if (!value.startsWith(TOKEN_PREFIX)) {
    throw new Error("Google Drive connection must be renewed to enable encrypted token storage");
  }
  const [ivValue, tagValue, ciphertextValue] = value.slice(TOKEN_PREFIX.length).split(":");
  if (!ivValue || !tagValue || !ciphertextValue) {
    throw new Error("Stored Google Drive token has an invalid encrypted format");
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
