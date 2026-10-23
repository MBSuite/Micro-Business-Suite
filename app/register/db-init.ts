"use server";

import { query } from "@/lib/db";

export async function checkAndInitUsersTable() {
  try {
    console.log("🔍 Verifying users schema...");

    // Schema is created by migrations (scripts/bootstrap-init-db.mjs).
    // Runtime never creates or alters tables.
    const checkRes = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'users'
      ) AS exists;
    `);

    const exists = checkRes.rows[0].exists;

    if (!exists) {
      console.error("❌ Table 'users' not found.");
      return {
        success: false,
        error: "ยังไม่ได้ตั้งค่าฐานข้อมูล (ไม่พบตาราง users) กรุณารันสคริปต์ bootstrap ก่อน",
      };
    }

    const colRes = await query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users';
    `);

    const columns = (colRes.rows as { column_name: string }[]).map((r) => r.column_name.toLowerCase());
    const required = ['email', 'password', 'name', 'role', 'status'];
    const missing = required.filter((column) => !columns.includes(column));

    if (missing.length > 0) {
      console.error("❌ users schema incomplete. Missing:", missing);
      return {
        success: false,
        error: `โครงสร้างตาราง users ไม่ครบ (ขาด: ${missing.join(', ')}) กรุณารันสคริปต์ bootstrap`,
      };
    }

    return { success: true, message: "โครงสร้างตารางสมบูรณ์แล้ว" };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "DB Init Error";
    console.error("❌ DB Init Error:", errorMsg);
    return { success: false, error: errorMsg };
  }
}

export async function promoteUserAction(email: string) {
  try {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail) {
      return { success: false, error: "กรุณาระบุอีเมลที่ต้องการอัปเกรดสิทธิ์" };
    }

    const res = await query(
      `UPDATE users 
       SET role = 'superadmin', 
           status = 'Active', 
           name = COALESCE(NULLIF(name, ''), 'Admin') 
       WHERE LOWER(email) = $1 
       RETURNING id, name, email, role, status`,
      [normalizedEmail]
    );

    if (res.rows.length > 0) {
      return { 
        success: true, 
        message: `อัปเกรดผู้ใช้ ${res.rows[0].email} เป็นบทบาท superadmin เรียบร้อยแล้ว!` 
      };
    } else {
      return { success: false, error: `ไม่พบอีเมล ${normalizedEmail} ในระบบ` };
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการดำเนินการ";
    return { success: false, error: msg };
  }
}
