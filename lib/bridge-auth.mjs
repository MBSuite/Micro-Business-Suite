import { timingSafeEqual } from "node:crypto";

/** @param {Request} request @param {string | undefined} configuredToken */
export function hasBridgeServiceToken(request, configuredToken) {
  if (!configuredToken) return false;

  const authorization = request.headers.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  const providedToken = match?.[1]?.trim();
  if (!providedToken) return false;

  const provided = Buffer.from(providedToken);
  const configured = Buffer.from(configuredToken);
  return provided.length === configured.length && timingSafeEqual(provided, configured);
}
