"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  contactMatchesUsage,
  normalizeContactType,
} from "@/lib/contacts";
import { ensureContactsSchema } from "@/lib/actions-helpers";
import { auth, getUserCompanyId } from "@/lib/auth";

async function requireSession(): Promise<{ companyId: number } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "กรุณาเข้าสู่ระบบก่อนดำเนินการ" };
  const companyId = await getUserCompanyId(session.user.id);
  return { companyId };
}

export async function getContacts(usage: "invoice" | "expense" | "all" = "all") {
  try {
    const ctx = await requireSession();
    if ("error" in ctx) return { success: false, error: ctx.error };
    await ensureContactsSchema();
    const { rows } = await query(
      `SELECT * FROM contacts WHERE company_id = $1 ORDER BY name ASC`,
      [ctx.companyId]
    );
    const filtered = rows
      .map((row: any) => ({
        ...row,
        contact_type: normalizeContactType(row.contact_type || row.type),
      }))
      .filter((row: any) => contactMatchesUsage(row.contact_type, usage));
    return { success: true, data: filtered };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createContact(data: any) {
  try {
    const ctx = await requireSession();
    if ("error" in ctx) return { success: false, error: ctx.error };
    const res = await query(
      `INSERT INTO contacts (name, type, email, phone, address, tax_id, company_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [data.name, data.type || "CUSTOMER", data.email, data.phone, data.address, data.tax_id, ctx.companyId]
    );
    revalidatePath("/contacts");
    return { success: true, id: res.rows[0].id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateContact(id: string | number, data: any) {
  try {
    const ctx = await requireSession();
    if ("error" in ctx) return { success: false, error: ctx.error };
    const res = await query(
      `UPDATE contacts
       SET name = $1, type = $2, email = $3, phone = $4, address = $5, tax_id = $6
       WHERE id = $7 AND company_id = $8`,
      [data.name, data.type, data.email, data.phone, data.address, data.tax_id || null, id, ctx.companyId]
    );
    if (res.rowCount === 0) return { success: false, error: "ไม่พบข้อมูลผู้ติดต่อนี้" };
    revalidatePath("/contacts");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}