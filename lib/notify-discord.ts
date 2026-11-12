/**
 * Outbound Discord notifications for support events.
 *
 * Reads DISCORD_WEBHOOK_URL from the current project's environment. Each project
 * has its own webhook value, so this module is safe to copy unchanged into the
 * Core app and every module app (see docs/SUPPORT_CHANNELS.md).
 *
 * Design rules:
 * - Never throws. A failed notification must not break the request that triggered it.
 * - Never logs the webhook URL (it is a credential: anyone holding it can post).
 * - Short timeout so a slow Discord response cannot stall a serverless invocation.
 */

export type DiscordNotification = {
  title: string;
  description?: string;
  url?: string;
  color?: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
};

const REQUEST_TIMEOUT_MS = 5_000;
const MAX_TITLE = 256;
const MAX_DESCRIPTION = 4_000;
const MAX_FIELD_VALUE = 1_024;
const MAX_FIELDS = 10;

function clip(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export async function notifyDiscord(input: DiscordNotification): Promise<boolean> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("[support] DISCORD_WEBHOOK_URL is not configured; skipping notification");
    return false;
  }

  const productName = process.env.SUPPORT_PRODUCT_NAME || "Micro-Business-Suite";
  const payload = {
    username: `${productName} Support`,
    allowed_mentions: { parse: [] },
    embeds: [
      {
        title: clip(input.title, MAX_TITLE),
        description: input.description ? clip(input.description, MAX_DESCRIPTION) : undefined,
        url: input.url,
        color: input.color ?? 0x2563eb,
        fields: (input.fields || []).slice(0, MAX_FIELDS).map((field) => ({
          name: clip(field.name, MAX_TITLE),
          value: clip(field.value || "-", MAX_FIELD_VALUE),
          inline: Boolean(field.inline),
        })),
        footer: { text: productName },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (res.ok) return true;

      if (res.status === 429 && attempt === 0) {
        const retryAfter = Number(res.headers.get("retry-after") || "0");
        const waitMs = Math.min(Math.max(retryAfter, 0), 2) * 1_000;
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }

      console.warn(`[support] Discord notification failed with status ${res.status}`);
      return false;
    } catch (error) {
      console.warn(
        `[support] Discord notification error: ${error instanceof Error ? error.message : "unknown"}`
      );
      return false;
    }
  }

  return false;
}
