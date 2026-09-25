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

export async function getProducts() {
  try {
    const ctx = await requireSession();
    if ("error" in ctx) return { success: false, error: ctx.error };
    const { rows } = await query(
      "SELECT * FROM products WHERE company_id = $1 ORDER BY name ASC",
      [ctx.companyId]
    );
    return { success: true, data: rows };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getNextSkuNumber() {
  try {
    const ctx = await requireSession();
    if ("error" in ctx) return { success: false, error: ctx.error };
    const { rows } = await query(
      `SELECT sku_number FROM products WHERE sku_number LIKE 'SKU-%' AND company_id = $1 ORDER BY id DESC LIMIT 1`,
      [ctx.companyId]
    );
    if (rows.length > 0) {
      const match = rows[0].sku_number.match(/SKU-(\d+)/);
      if (match && match[1]) {
        const nextNum = parseInt(match[1], 10) + 1;
        return { success: true, sku: `SKU-${String(nextNum).padStart(6, "0")}` };
      }
    }
    return { success: true, sku: "SKU-000001" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createProduct(data: any) {
  try {
    const ctx = await requireSession();
    if ("error" in ctx) return { success: false, error: ctx.error };
    const res = await query(
      `INSERT INTO products (name, category_name, type, sku_number, source_info, storage_location, stock_quantity, price, product_notes, supplier_cost, markup_rate, company_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
      [
        data.name,
        data.category_name,
        data.type,
        data.sku_number,
        data.source_info,
        data.storage_location,
        data.stock_quantity,
        data.price,
        data.product_notes,
        data.supplier_cost || 0,
        data.markup_rate || 0,
        ctx.companyId,
      ]
    );
    revalidatePath("/inventory");
    return { success: true, id: res.rows[0].id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateProduct(id: string | number, data: any) {
  try {
    const ctx = await requireSession();
    if ("error" in ctx) return { success: false, error: ctx.error };
    const res = await query(
      `UPDATE products
       SET name=$1, type=$2, sku_number=$3, source_info=$4, storage_location=$5, stock_quantity=$6, price=$7, product_notes=$8
       WHERE id=$9 AND company_id=$10`,
      [
        data.name,
        data.type,
        data.sku_number,
        data.source_info,
        data.storage_location,
        data.stock_quantity,
        data.price,
        data.product_notes,
        id,
        ctx.companyId,
      ]
    );
    if (res.rowCount === 0) return { success: false, error: "ไม่พบข้อมูลสินค้านี้" };
    revalidatePath("/inventory");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteProduct(id: string | number) {
  try {
    const ctx = await requireSession();
    if ("error" in ctx) return { success: false, error: ctx.error };
    const res = await query(`DELETE FROM products WHERE id = $1 AND company_id = $2`, [id, ctx.companyId]);
    if (res.rowCount === 0) return { success: false, error: "ไม่พบข้อมูลสินค้านี้" };
    revalidatePath("/inventory");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCategories() {
  try {
    const ctx = await requireSession();
    if ("error" in ctx) return { success: false, error: ctx.error };
    const { rows } = await query(
      "SELECT * FROM product_categories WHERE company_id = $1 ORDER BY name ASC",
      [ctx.companyId]
    );
    return { success: true, data: rows };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createCategory(name: string, description: string = "") {
  try {
    const ctx = await requireSession();
    if ("error" in ctx) return { success: false, error: ctx.error };
    const { rows } = await query(
      `INSERT INTO product_categories (name, description, company_id) VALUES ($1, $2, $3) RETURNING id`,
      [name, description, ctx.companyId]
    );
    return { success: true, id: rows[0].id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateCategory(id: number, name: string, description: string = "") {
  try {
    const ctx = await requireSession();
    if ("error" in ctx) return { success: false, error: ctx.error };
    await query(
      `UPDATE product_categories SET name=$1, description=$2 WHERE id=$3 AND company_id=$4`,
      [name, description, id, ctx.companyId]
    );
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCategory(id: number) {
  try {
    const ctx = await requireSession();
    if ("error" in ctx) return { success: false, error: ctx.error };
    await query(`DELETE FROM product_categories WHERE id=$1 AND company_id=$2`, [id, ctx.companyId]);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}