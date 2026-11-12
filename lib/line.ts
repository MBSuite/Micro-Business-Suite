import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Minimal LINE Messaging API client + webhook signature verification.
 *
 * Facts this module relies on:
 * - Signature is HMAC-SHA256 over the raw request body, base64-encoded, sent in
 *   the `x-line-signature` header and keyed with the channel secret.
 * - Reply messages are free and use a single-use `replyToken` with a short TTL.
 * - Push messages count against the account's monthly quota and are used when
 *   the reply token is no longer valid (e.g. a human agent answers later).
 */

const LINE_API_BASE = "https://api.line.me/v2/bot";
const REQUEST_TIMEOUT_MS = 5_000;

export type LineSendResult = { ok: boolean; status: number; error?: string };

export function verifyLineSignature(
  rawBody: string,
  signature: string | null,
  channelSecret: string | undefined = process.env.LINE_CHANNEL_SECRET
): boolean {
  if (!signature || !channelSecret) return false;

  const expected = createHmac("sha256", channelSecret).update(rawBody, "utf8").digest();
  let provided: Buffer;
  try {
    provided = Buffer.from(signature, "base64");
  } catch {
    return false;
  }

  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}

async function callLineApi(path: string, body: unknown): Promise<LineSendResult> {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!accessToken) {
    return { ok: false, status: 0, error: "LINE_CHANNEL_ACCESS_TOKEN is not configured" };
  }

  try {
    const res = await fetch(`${LINE_API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (res.ok) return { ok: true, status: res.status };

    const detail = await res.text().catch(() => "");
    return { ok: false, status: res.status, error: detail.slice(0, 300) };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : "network error",
    };
  }
}

export function lineText(text: string) {
  return { type: "text", text: text.slice(0, 5_000) };
}

export function replyLineMessage(replyToken: string, messages: unknown[]): Promise<LineSendResult> {
  return callLineApi("/message/reply", { replyToken, messages });
}

export function pushLineMessage(to: string, messages: unknown[]): Promise<LineSendResult> {
  return callLineApi("/message/push", { to, messages });
}
