import { jwtVerify, SignJWT } from "jose";

type GoogleOAuthState = {
  nonce: string;
  userId: string;
  companyId: number;
};

function getStateSecret() {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) throw new Error("Session signing secret is not configured");
  return new TextEncoder().encode(secret);
}

export async function signGoogleOAuthState(state: GoogleOAuthState) {
  return new SignJWT(state)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("mbsuite")
    .setAudience("google-drive-connect")
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(getStateSecret());
}

export async function verifyGoogleOAuthState(token: string, nonce: string) {
  const { payload } = await jwtVerify(token, getStateSecret(), {
    issuer: "mbsuite",
    audience: "google-drive-connect",
  });
  if (
    payload.nonce !== nonce ||
    typeof payload.userId !== "string" ||
    typeof payload.companyId !== "number" ||
    !Number.isInteger(payload.companyId)
  ) {
    throw new Error("Google OAuth state does not match");
  }
  return {
    userId: payload.userId,
    companyId: Number(payload.companyId),
  };
}
