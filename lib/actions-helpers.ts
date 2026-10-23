import { query } from "@/lib/db";
import { getGoogleDrive } from "@/lib/google-server";

export async function getOrCreateFolder(folderName: string) {
  try {
    const drive = await getGoogleDrive();
    const response = await drive.files.list({
      q: `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id, name)",
      spaces: "drive",
    });
    const folders = response.data.files;
    if (folders && folders.length > 0) return folders[0].id;
    const folder = await drive.files.create({
      requestBody: { name: folderName, mimeType: "application/vnd.google-apps.folder" },
      fields: "id",
    });
    return folder.data.id;
  } catch (error: any) {
    console.error("Folder Error:", error);
    return null;
  }
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
