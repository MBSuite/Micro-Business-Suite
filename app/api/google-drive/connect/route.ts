import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth, getUserCompanyId } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { getGoogleOAuthClient } from "@/lib/google-server";
import { signGoogleOAuthState } from "@/lib/google-oauth-state";

const STATE_COOKIE = "google-drive-oauth-state";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!redirectUri) {
    return NextResponse.json({ error: "Google OAuth callback URL is not configured" }, { status: 503 });
  }

  let callbackUrl: URL;
  try {
    callbackUrl = new URL(redirectUri);
  } catch {
    return NextResponse.json({ error: "Google OAuth callback URL is invalid" }, { status: 503 });
  }
  if (callbackUrl.pathname !== "/api/google-drive/callback") {
    return NextResponse.json({ error: "Google OAuth callback path is invalid" }, { status: 503 });
  }
  if (callbackUrl.search || callbackUrl.hash) {
    return NextResponse.json({ error: "Google OAuth callback URL must not include query or fragment" }, { status: 503 });
  }
  if (process.env.NODE_ENV === "production" && callbackUrl.protocol !== "https:") {
    return NextResponse.json({ error: "Google OAuth callback URL must use HTTPS" }, { status: 503 });
  }
  if (!process.env.GOOGLE_TOKEN_ENCRYPTION_KEY) {
    return NextResponse.json({ error: "Google token encryption is not configured on the server" }, { status: 503 });
  }

  try {
    const companyId = await getUserCompanyId(session.user.id);
    const state = randomBytes(32).toString("hex");
    const signedState = await signGoogleOAuthState({
      nonce: state,
      userId: session.user.id,
      companyId,
    });
    const oauthClient = getGoogleOAuthClient(callbackUrl.toString());
    const authorizationUrl = oauthClient.generateAuthUrl({
      access_type: "offline",
      include_granted_scopes: true,
      prompt: "consent",
      scope: [
        "openid",
        "email",
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/spreadsheets",
      ],
      state,
    });

    const cookieStore = await cookies();
    cookieStore.set(STATE_COOKIE, signedState, {
      httpOnly: true,
      secure: callbackUrl.protocol === "https:",
      sameSite: "lax",
      path: "/api/google-drive/callback",
      maxAge: 600,
    });
    return NextResponse.redirect(authorizationUrl);
  } catch {
    console.error("Google Drive OAuth start failed");
    return NextResponse.json({ error: "Could not start Google Drive connection" }, { status: 503 });
  }
}
