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

export async function getServices() {
  try {
    const ctx = await requireSession();
    if ("error" in ctx) return { success: false, error: ctx.error };
    const { rows } = await query(
      "SELECT * FROM services WHERE company_id = $1 ORDER BY name ASC",
      [ctx.companyId]
    );
    return { success: true, data: rows };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getService(id: string | number) {
  try {
    const ctx = await requireSession();
    if ("error" in ctx) return { success: false, error: ctx.error };
    const { rows } = await query("SELECT * FROM services WHERE id = $1 AND company_id = $2", [
      id,
      ctx.companyId,
    ]);
    if (rows.length === 0) throw new Error("Service not found");
    return { success: true, data: rows[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createService(data: any) {
  try {
    const ctx = await requireSession();
    if ("error" in ctx) return { success: false, error: ctx.error };
    const res = await query(
      `INSERT INTO services (service_code, name, description, service_type, unit_price, is_wht_applicable, company_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        data.service_code,
        data.name,
        data.description,
        data.service_type || 'service',
        data.unit_price || 0,
        data.is_wht_applicable ?? true,
        ctx.companyId,
      ]
    );
    revalidatePath("/services");
    return { success: true, id: res.rows[0].id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateService(id: string | number, data: any) {
  try {
    const ctx = await requireSession();
    if ("error" in ctx) return { success: false, error: ctx.error };
    const res = await query(
      `UPDATE services
       SET service_code=$1, name=$2, description=$3, service_type=$4, unit_price=$5, is_wht_applicable=$6, updated_at=NOW()
       WHERE id=$7 AND company_id=$8`,
      [
        data.service_code,
        data.name,
        data.description,
        data.service_type,
        data.unit_price,
        data.is_wht_applicable,
        id,
        ctx.companyId,
      ]
    );
    if (res.rowCount === 0) return { success: false, error: "ไม่พบข้อมูลบริการนี้" };
    revalidatePath("/services");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteService(id: string | number) {
  try {
    const ctx = await requireSession();
    if ("error" in ctx) return { success: false, error: ctx.error };
    const res = await query(`DELETE FROM services WHERE id = $1 AND company_id = $2`, [id, ctx.companyId]);
    if (res.rowCount === 0) return { success: false, error: "ไม่พบข้อมูลบริการนี้" };
    revalidatePath("/services");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}