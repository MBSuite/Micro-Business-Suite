// lib/module-link-validation.mjs
// Pure helpers for optional Core linking (ADR-0006). No DB / no server-only
// imports so they can be unit-tested with node:test.

import { createHash } from "node:crypto";

export const MODULES = ["retail", "rental", "pharmacy", "hotel", "fnb", "service"];

const MODULE_SET = new Set(MODULES);

/** Link codes use the same unambiguous alphabet as module shop codes. */
export const LINK_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const LINK_CODE_LENGTH = 8;
export const LINK_CODE_TTL_MINUTES = 15;

const LINK_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{8}$/;
const SHOP_CODE_PATTERN = /^([1-9][0-9]*|R[A-HJ-NP-Z2-9]{6})$/;

export function isModuleName(value) {
  return typeof value === "string" && MODULE_SET.has(value);
}

/** Uppercases a link code; returns null when it cannot be a valid code. */
export function normalizeLinkCode(value) {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  return LINK_CODE_PATTERN.test(code) ? code : null;
}

/** Accepts a legacy numeric company id or a module shop code (R + 6). */
export function normalizeShopCode(value) {
  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) {
    return String(value);
  }
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  return SHOP_CODE_PATTERN.test(code) ? code : null;
}

/**
 * Generates an 8-character link code using a caller-supplied random source so
 * tests can make it deterministic.
 * @param {(max: number) => number} [randomInt]
 */
export function generateLinkCode(randomInt) {
  const pick = randomInt || ((max) => Math.floor(Math.random() * max));
  let code = "";
  for (let i = 0; i < LINK_CODE_LENGTH; i += 1) {
    code += LINK_CODE_ALPHABET[pick(LINK_CODE_ALPHABET.length)];
  }
  return code;
}

/**
 * @param {string} code normalized link code
 * @returns {string} sha256 hex digest
 */
export function sha256Hex(code) {
  return createHash("sha256").update(code, "utf8").digest("hex");
}

/**
 * Decides whether a stored code row can still be claimed.
 * @param {{ used_at?: string | Date | null, expires_at: string | Date }} row
 * @param {Date} [now]
 * @returns {"invalid" | "used" | "expired" | "ok"}
 */
export function linkCodeState(row, now = new Date()) {
  if (!row) return "invalid";
  if (row.used_at) return "used";
  const expiresAt = new Date(row.expires_at).getTime();
  if (!Number.isFinite(expiresAt) || expiresAt <= now.getTime()) return "expired";
  return "ok";
}

/** Converts a Date/string to ISO or null (used in API responses). */
export function toIso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}
