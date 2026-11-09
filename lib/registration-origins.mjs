const CORE_ORIGIN = "https://micro-business-suite.vercel.app";

const MODULE_BUSINESS_TYPES = Object.freeze({
  "https://micro-business-service.vercel.app": "service",
  "https://micro-business-retail.vercel.app": "retail",
  "https://micro-business-rental.vercel.app": "rental",
  "https://micro-business-pharmacy.vercel.app": "pharmacy",
  "https://micro-business-hotel.vercel.app": "hotel",
  "https://micro-business-fnb.vercel.app": "fnb",
});

export function getRegistrationOrigin(origin, additionalOrigins = "") {
  if (typeof origin !== "string" || origin === "null") return null;

  let parsedOrigin;
  try {
    const url = new URL(origin);
    if (url.origin !== origin || !["https:", "http:"].includes(url.protocol)) return null;
    parsedOrigin = url.origin;
  } catch {
    return null;
  }

  const allowedOrigins = new Set([
    CORE_ORIGIN,
    ...Object.keys(MODULE_BUSINESS_TYPES),
    ...additionalOrigins
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  ]);
  if (!allowedOrigins.has(parsedOrigin)) return null;

  return {
    origin: parsedOrigin,
    businessType: MODULE_BUSINESS_TYPES[parsedOrigin] ?? null,
  };
}
