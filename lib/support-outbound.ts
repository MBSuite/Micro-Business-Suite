/**
 * Pure helpers for the support outbound path.
 *
 * Kept separate from the route so the rules can be unit-tested without a
 * database or network access.
 */

export const MAX_OUTBOUND_TEXT = 5_000;
export const THREAD_STATUSES = ["open", "pending", "closed"] as const;
export const THREAD_PRIORITIES = ["low", "normal", "high", "urgent"] as const;

export type ThreadStatus = (typeof THREAD_STATUSES)[number];
export type ThreadPriority = (typeof THREAD_PRIORITIES)[number];

export type OutboundTextResult =
  | { ok: true; text: string }
  | { ok: false; reason: "invalid" | "empty" | "too_long" };

export function normalizeOutboundText(input: unknown): OutboundTextResult {
  if (typeof input !== "string") return { ok: false, reason: "invalid" };
  const text = input.trim();
  if (text.length === 0) return { ok: false, reason: "empty" };
  if (text.length > MAX_OUTBOUND_TEXT) return { ok: false, reason: "too_long" };
  return { ok: true, text };
}

/**
 * Only LINE has an outbound implementation today. Discord is notification-only
 * (incoming webhook); replying inside Discord needs a bot and is out of scope.
 */
export function supportsOutbound(provider: string): boolean {
  return provider === "line";
}

/**
 * LINE user ids are stable identifiers. The admin UI never needs the full value,
 * so the API returns only a suffix hint to keep support for PII low.
 */
export function maskExternalId(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.length <= 4) return "…";
  return `…${value.slice(-4)}`;
}

export function isThreadStatus(value: unknown): value is ThreadStatus {
  return typeof value === "string" && (THREAD_STATUSES as readonly string[]).includes(value);
}

export function isThreadPriority(value: unknown): value is ThreadPriority {
  return typeof value === "string" && (THREAD_PRIORITIES as readonly string[]).includes(value);
}
