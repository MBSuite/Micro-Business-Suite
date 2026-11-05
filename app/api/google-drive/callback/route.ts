import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth, getUserCompanyId } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { getGoogleOAuthClient } from "@/lib/google-server";
import { verifyGoogleOAuthState } from "@/lib/google-oauth-state";
import { encryptGoogleRefreshToken } from "@/lib/google-token-crypto";
import { query } from "@/lib/db";

const STATE_COOKIE = "google-drive-oauth-state";

function settingsRedirect(result: "connected" | "error") {
  const callbackUrl = process.env.GOOGLE_REDIRECT_URI;
  if (!callbackUrl) throw new Error("Google OAuth callback URL is not configured");
  const url = new URL("/settings", callbackUrl);
  url.searchParams.set("tab", "google-drive");
  url.searchParams.set("googleDrive", result);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE)?.value;
  const receivedState = requestUrl.searchParams.get("state");
  let response: NextResponse;
  try {
    response = settingsRedirect("error");
  } catch {
    response = NextResponse.json({ error: "Google OAuth callback URL is not configured" }, { status: 503 });
  }
  response.cookies.set(STATE_COOKIE, "", {
    httpOnly: true,
    secure: requestUrl.protocol === "https:",
    sameSite: "lax",
    path: "/api/google-drive/callback",
    maxAge: 0,
  });

  if (!expectedState || !receivedState || requestUrl.searchParams.has("error")) {
    return response;
  }
  let stateClaims: Awaited<ReturnType<typeof verifyGoogleOAuthState>>;
  try {
    stateClaims = await verifyGoogleOAuthState(expectedState, receivedState);
  } catch {
    return response;
  }

  const code = requestUrl.searchParams.get("code");
  const configuredRedirectUri = process.env.GOOGLE_REDIRECT_URI;
  let callbackOrigin: string;
  try {
    callbackOrigin = new URL(configuredRedirectUri || "").origin;
  } catch {
    return response;
  }
  if (callbackOrigin !== requestUrl.origin) {
    return response;
  }
  const session = await auth();
  if (
    !code ||
    !session?.user?.id ||
    session.user.id !== stateClaims.userId ||
    !(await isAdmin(session.user.id))
  ) {
    return response;
  }

  try {
    const companyId = await getUserCompanyId(session.user.id);
    if (companyId !== stateClaims.companyId) return response;
    const redirectUri = configuredRedirectUri;
    if (!redirectUri) throw new Error("Google OAuth callback URL is not configured");
    if (!process.env.GOOGLE_TOKEN_ENCRYPTION_KEY) {
      throw new Error("Google token encryption is not configured");
    }

    const oauthClient = getGoogleOAuthClient(redirectUri);
    const { tokens } = await oauthClient.getToken(code);
    if (tokens.refresh_token) oauthClient.setCredentials(tokens);
    else oauthClient.setCredentials({ access_token: tokens.access_token });

    const profile = await oauthClient.request<{ email?: string; verified_email?: boolean }>({
      url: "https://www.googleapis.com/oauth2/v2/userinfo",
    });
    const email = profile.data.email?.trim().toLowerCase();
    if (!email || profile.data.verified_email === false) {
      throw new Error("Google did not return a verified account email");
    }

    const current = await query(
      `SELECT google_refresh_token, google_drive_account_email
       FROM company_settings WHERE company_id = $1 LIMIT 1`,
      [companyId]
    );
    if (!current.rows.length) throw new Error("Company settings not found");

    const currentEmail = String(current.rows[0].google_drive_account_email || "").toLowerCase();
    const storedRefreshToken = String(current.rows[0].google_refresh_token || "");
    const encryptedRefreshToken = tokens.refresh_token
      ? encryptGoogleRefreshToken(tokens.refresh_token)
      : currentEmail === email && storedRefreshToken.startsWith("enc:v1:")
        ? storedRefreshToken
        : null;
    if (!encryptedRefreshToken) {
      throw new Error("Google did not issue a refresh token; revoke this app in Google Account permissions and reconnect");
    }

    await query(
      `UPDATE company_settings
       SET google_refresh_token = $1, google_drive_account_email = $2,
           google_drive_enabled = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE company_id = $3`,
      [encryptedRefreshToken, email, companyId]
    );

    return settingsRedirect("connected");
  } catch {
    console.error("Google Drive OAuth callback failed");
    return response;
  }
}
