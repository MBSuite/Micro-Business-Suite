/* eslint-disable @typescript-eslint/no-explicit-any */
import { query } from "@/lib/db";
import { getGoogleDrive } from "@/lib/google-server";

export async function getOrCreateFolder(companyId: number, folderName: string) {
  const drive = await getGoogleDrive(companyId);
  const escapedFolderName = folderName.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  const response = await drive.files.list({
    q: `name = '${escapedFolderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id, name)",
    spaces: "drive",
  });
  const existingFolderId = response.data.files?.[0]?.id;
  if (existingFolderId) return existingFolderId;

  const folder = await drive.files.create({
    requestBody: { name: folderName, mimeType: "application/vnd.google-apps.folder" },
    fields: "id",
  });
  if (!folder.data.id) {
    throw new Error("Google Drive did not return the created folder ID");
  }
  return folder.data.id;
}

export async function ensureContactsSchema(): Promise<boolean> {
  try {
    const { rows } = await query(`
      SELECT COUNT(*)::int AS count FROM information_schema.columns
      WHERE table_name = 'contacts' AND column_name IN ('contact_type', 'company_id')
    `);
    return Number(rows[0]?.count || 0) === 2;
  } catch (e) {
    return false;
  }
}
