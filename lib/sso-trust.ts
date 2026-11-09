const TRUSTED_SSO_CALLBACKS = {
  "mbs-service": "https://micro-business-service.vercel.app/auth/sso-callback",
  "mbs-retail": "https://micro-business-retail.vercel.app/auth/sso-callback",
  "mbs-rental": "https://micro-business-rental.vercel.app/auth/sso-callback",
  "mbs-pharmacy": "https://micro-business-pharmacy.vercel.app/auth/sso-callback",
  "mbs-hotel": "https://micro-business-hotel.vercel.app/auth/sso-callback",
  "mbs-fnb": "https://micro-business-fnb.vercel.app/auth/sso-callback",
} as const;

export type TrustedSsoAudience = keyof typeof TRUSTED_SSO_CALLBACKS;

export function getTrustedSsoCallback(
  audience: string,
  callbackUrl?: string
): string | null {
  if (!Object.hasOwn(TRUSTED_SSO_CALLBACKS, audience)) return null;
  const trustedCallback = TRUSTED_SSO_CALLBACKS[audience as TrustedSsoAudience];
  if (callbackUrl !== undefined && callbackUrl !== trustedCallback) return null;
  return trustedCallback;
}
