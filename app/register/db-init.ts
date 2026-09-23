"use server";

import { query } from "@/lib/db";

export async function checkAndInitUsersTable() {
  try {
    console.log("🔍 Running DB Initialization...");
    
    // Check if table exists
    const checkRes = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    const exists = checkRes.rows[0].exists;
    
    if (!exists) {
      console.log("❌ Table 'users' not found. Creating...");
      await query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(255),
          role VARCHAR(50) DEFAULT 'user',
          status VARCHAR(20) DEFAULT 'Pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      return { success: true, message: "สร้างตาราง users สำเร็จ" };
    } else {
      // If table exists, check for mandatory columns
      const colRes = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users';
      `);
      
      const columns = (colRes.rows as { column_name: string }[]).map((r) => r.column_name.toLowerCase());
      console.log("📊 Existing columns:", columns);
      
      const missing = [];
      if (!columns.includes('email')) missing.push("email VARCHAR(255) UNIQUE NOT NULL");
      if (!columns.includes('password')) missing.push("password VARCHAR(255) NOT NULL");
      if (!columns.includes('name')) missing.push("name VARCHAR(255)");
      if (!columns.includes('role')) missing.push("role VARCHAR(50) DEFAULT 'user'");
      if (!columns.includes('status')) missing.push("status VARCHAR(20) DEFAULT 'Pending'");

      if (missing.length > 0) {
        console.log("⚠️ Schema mismatch detected. Applying safe additive migration...");
        for (const columnDef of missing) {
          await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${columnDef}`);
        }
        return { success: true, message: "อัปเดตโครงสร้างตาราง users แบบปลอดภัยเรียบร้อยแล้ว" };
      }
      
      return { success: true, message: "โครงสร้างตารางสมบูรณ์แล้ว" };
    }
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
