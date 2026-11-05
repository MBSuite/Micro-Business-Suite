import "server-only";
import { google } from "googleapis";
import { query } from "@/lib/db";
import { decryptGoogleRefreshToken } from "@/lib/google-token-crypto";

type GoogleSettings = {
  google_refresh_token: string | null;
  google_drive_enabled: boolean | null;
};

function getGoogleOAuthConfig(redirectUri?: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth is not configured on the server");
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getGoogleOAuthClient(redirectUri: string) {
  return getGoogleOAuthConfig(redirectUri);
}

export async function getGoogleDrive(companyId: number) {
  if (!Number.isInteger(companyId) || companyId < 1) {
    throw new Error("Valid company context is required for Google Drive");
  }

  const { rows } = await query(
    `SELECT google_refresh_token, google_drive_enabled
     FROM company_settings
     WHERE company_id = $1
     LIMIT 1`,
    [companyId]
  );
  const settings = rows[0] as GoogleSettings | undefined;
  if (!settings?.google_drive_enabled || !settings.google_refresh_token) {
    throw new Error("Google Drive is not connected for this company");
  }

  const auth = getGoogleOAuthConfig();
  auth.setCredentials({ refresh_token: decryptGoogleRefreshToken(settings.google_refresh_token) });
  return google.drive({ version: "v3", auth });
}

export async function getGoogleSheets(companyId: number) {
  if (!Number.isInteger(companyId) || companyId < 1) {
    throw new Error("Valid company context is required for Google Sheets");
  }

  const { rows } = await query(
    `SELECT google_refresh_token, google_drive_enabled
     FROM company_settings
     WHERE company_id = $1
     LIMIT 1`,
    [companyId]
  );
  const settings = rows[0] as GoogleSettings | undefined;
  if (!settings?.google_drive_enabled || !settings.google_refresh_token) {
    throw new Error("Google Drive is not connected for this company");
  }

  const auth = getGoogleOAuthConfig();
  auth.setCredentials({ refresh_token: decryptGoogleRefreshToken(settings.google_refresh_token) });
  return google.sheets({ version: "v4", auth });
}

export async function checkGoogleAuth(companyId: number) {
  try {
    const drive = await getGoogleDrive(companyId);
    await drive.about.get({ fields: "user(emailAddress)" });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
