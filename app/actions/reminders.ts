"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth, getUserCompanyId } from "@/lib/auth";

async function requireSession(): Promise<{ companyId: number } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "กรุณาเข้าสู่ระบบก่อนดำเนินการ" };
  const companyId = await getUserCompanyId(session.user.id);
  return { companyId };
}

export async function getReminders() {
  try {
    const ctx = await requireSession();
    if ("error" in ctx) return { success: false, error: ctx.error };
    const res = await query(
      "SELECT * FROM reminders WHERE company_id = $1 AND status != 'deleted' ORDER BY due_date ASC",
      [ctx.companyId]
    );
    return { success: true, data: res.rows };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createReminder(data: any) {
  try {
    const ctx = await requireSession();
    if ("error" in ctx) return { success: false, error: ctx.error };
    const res = await query(
      `INSERT INTO reminders (title, description, due_date, status, type, company_id)
       VALUES ($1, $2, $3, 'pending', 'manual', $4) RETURNING id`,
      [data.title, data.description, data.due_date, ctx.companyId]
    );
    revalidatePath("/calendar");
    return { success: true, id: res.rows[0].id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateReminderStatus(id: number | string, status: string) {
  try {
    const ctx = await requireSession();
    if ("error" in ctx) return { success: false, error: ctx.error };
    const res = await query(
      `UPDATE reminders SET status = $1 WHERE id = $2 AND company_id = $3`,
      [status, id, ctx.companyId]
    );
    if (res.rowCount === 0) return { success: false, error: "ไม่พบข้อมูลรายการนี้" };
    revalidatePath("/calendar");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteReminder(id: number | string) {
  try {
    const ctx = await requireSession();
    if ("error" in ctx) return { success: false, error: ctx.error };
    const res = await query(
      `UPDATE reminders SET status = 'deleted' WHERE id = $1 AND company_id = $2`,
      [id, ctx.companyId]
    );
    if (res.rowCount === 0) return { success: false, error: "ไม่พบข้อมูลรายการนี้" };
    revalidatePath("/calendar");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}