/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
"use server";

import { query } from "@/lib/db";
import { auth, getUserCompanyId } from "@/lib/auth";
import { getGoogleDrive, getGoogleSheets } from "@/lib/google-server";
import { Readable } from "stream";
import { getOrCreateFolder } from "@/lib/actions-helpers";

export async function uploadToGoogleDrive(base64Data: string, fileName: string, mimeType: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    const companyId = await getUserCompanyId(session.user.id);
    const allowedMimeTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
    if (!allowedMimeTypes.has(mimeType)) {
      return { success: false, error: "Unsupported file type" };
    }

    const encodedData = base64Data.includes(",") ? base64Data.slice(base64Data.indexOf(",") + 1) : base64Data;
    if (
      !encodedData ||
      Buffer.byteLength(encodedData) > 950_000 ||
      !/^[A-Za-z0-9+/]*={0,2}$/.test(encodedData)
    ) {
      return { success: false, error: "Invalid or oversized file" };
    }
    const buffer = Buffer.from(encodedData, "base64");
    if (!buffer.length || buffer.length > 700_000) {
      return { success: false, error: "Invalid or oversized file" };
    }
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "receipt";
    const googleDrive = await getGoogleDrive(companyId);
    const folderId = await getOrCreateFolder(companyId, `Micro-Business-Suite Documents ${companyId}`);
    const stream = Readable.from(buffer);
    const response = await googleDrive.files.create({
      requestBody: {
        name: `Receipt_${Date.now()}_${safeFileName}`,
        mimeType: mimeType,
        parents: folderId ? [folderId] : [],
      },
      media: {
        mimeType: mimeType,
        body: stream,
      },
      fields: "id, webViewLink",
    });
    const fileId = response.data.id;
    return { 
      success: true, 
      url: response.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
      fileName: safeFileName
    };
  } catch (error: any) {
    console.error("Google Drive upload failed");
    return { success: false, error: error.message };
  }
}

export async function exportJournalsToSheets() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    const companyId = await getUserCompanyId(session.user.id);
    const googleDrive = await getGoogleDrive(companyId);
    const googleSheets = await getGoogleSheets(companyId);
    const { getJournalEntries } = await import("./journals");
    const result = await getJournalEntries();
    if (!result.success || !result.data || result.data.length === 0) throw new Error("ไม่มีข้อมูลให้ส่งออก");
    const entries = result.data;
    const folderId = await getOrCreateFolder(companyId, `Micro-Business-Suite Reports ${companyId}`);
    const spreadsheet = await googleSheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `Micro-Business-Suite - รายงานสมุดรายวัน (${new Date().toLocaleDateString('th-TH')})`,
        },
      },
    });
    const spreadsheetId = spreadsheet.data.spreadsheetId;
    if (!spreadsheetId) throw new Error("ไม่สามารถสร้างไฟล์ได้");
    if (folderId) {
      await googleDrive.files.update({
        fileId: spreadsheetId,
        addParents: folderId,
        removeParents: 'root',
        fields: 'id, parents',
      });
    }
    const values = [
      ["วันที่", "เลขที่เอกสาร", "ชื่อบัญชี", "หมายเหตุ", "เดบิต (Dr.)", "เครดิต (Cr.)"],
      ...entries.map((e: any) => [
        new Date(e.entry_date).toLocaleDateString('th-TH'),
        e.reference_no || "-",
        e.account_name,
        e.description,
        Number(e.debit) || 0,
        Number(e.credit) || 0
      ])
    ];
    await googleSheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId!,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      requestBody: { values },
    });
    return { 
      success: true, 
      url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      message: `สร้างรายงานสำเร็จที่ ID: ${spreadsheetId}`
    };
  } catch (error: any) {
    console.error("Google Sheets journal export failed");
    return { success: false, error: error.message };
  }
}

export async function exportVouchersToSheets() {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const companyId = await getUserCompanyId(session.user.id);
    const googleDrive = await getGoogleDrive(companyId);
    const googleSheets = await getGoogleSheets(companyId);
    const res = await query('SELECT * FROM payment_vouchers WHERE company_id = $1 ORDER BY issue_date DESC, id ASC', [companyId]);
    const vouchers = res.rows;
    if (vouchers.length === 0) throw new Error("No data");
    const folderId = await getOrCreateFolder(companyId, `Micro-Business-Suite Reports ${companyId}`);
    const spreadsheet = await googleSheets.spreadsheets.create({
      requestBody: { properties: { title: `Voucher Report ${new Date().toLocaleDateString('th-TH')}` } }
    });
    const spreadsheetId = spreadsheet.data.spreadsheetId;
    if (!spreadsheetId) throw new Error("Could not create spreadsheet");
    if (folderId) {
      await googleDrive.files.update({
        fileId: spreadsheetId,
        addParents: folderId,
        removeParents: "root",
        fields: "id, parents",
      });
    }
    const values = [
      ["Voucher No", "Payee", "Date", "Amount", "Method", "Status"],
      ...vouchers.map((v: any) => [v.voucher_no, v.payee_name, new Date(v.issue_date).toLocaleDateString('th-TH'), v.amount, v.payment_method, v.status])
    ];
    await googleSheets.spreadsheets.values.update({
      spreadsheetId, range: 'Sheet1!A1', valueInputOption: 'RAW', requestBody: { values }
    });
    return { success: true, url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit` };
  } catch (err: any) { return { success: false, error: err.message }; }
}
