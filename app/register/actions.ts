/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
"use server";

import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import {
  getRegistrationPluginPack,
  isRegistrationBusinessType,
} from "@/lib/registration-business-types.mjs";

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = (formData.get("email") as string)?.trim() ?? "";
  const normalizedEmail = email.toLowerCase();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const companyName = (formData.get("companyName") as string)?.trim() || null;
  const rawBusinessType = formData.get("businessType");
  if (rawBusinessType !== null && typeof rawBusinessType !== "string") {
    return { error: "กรุณาเลือกประเภทธุรกิจที่ถูกต้อง" };
  }
  const submittedBusinessType = rawBusinessType?.trim() || "general";

  if (!isRegistrationBusinessType(submittedBusinessType)) {
    return { error: "กรุณาเลือกประเภทธุรกิจที่ถูกต้อง" };
  }
  const businessType = submittedBusinessType;

  if (!name || !normalizedEmail || !password) {
    return { error: "กรุณากรอกข้อมูลให้ครบทุกช่อง" };
  }

  if (password !== confirmPassword) {
    return { error: "รหัสผ่านไม่ตรงกัน" };
  }

  if (password.length < 6) {
    return { error: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร" };
  }

  const client = await pool.connect();
  try {
    // ครอบทั้ง check + create + insert ไว้ใน transaction เดียว:
    // - ถ้า insert user ล้ม -> rollback ทั้งบริษัท trial ที่เพิ่งสร้าง ไม่ทิ้ง orphan company
    // - duplicate email ถูกเช็คซ้ำใน tx เดียวกัน (ลดความเสี่ยง ก่อน unique constraint จะมี)
    //   หมายเหตุ: ยังไม่ใช่ race-proof 100% สำหรับ concurrent requests จนกว่ามี UNIQUE constraint
    //   ที่ users.email — วางเป็น note สำหรับ WS-3
    await client.query("BEGIN");

    const checkRes = await client.query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [normalizedEmail]);
    if (checkRes.rows.length > 0) {
      await client.query("ROLLBACK");
      return { error: "อีเมลนี้ถูกใช้งานไปแล้ว" };
    }

    // สร้างบริษัทใหม่สำหรับลูกค้าคนนี้ 1 ลูกค้า = 1 บริษัท (แผน TRIAL, 1 user)
    const companyRes = await client.query(
      `
        INSERT INTO companies (
          name, plan_type, max_users, subscription_status, trial_end, expiry_date, business_type
        )
        VALUES ($1, 'TRIAL', 1, 'Active', NOW() + INTERVAL '30 days', NULL, $2)
        RETURNING id, name
      `,
      [companyName || `${name}'s Company`, businessType]
    );
    const companyId = companyRes.rows[0].id;

    await client.query(
      "INSERT INTO company_settings (company_id, name) VALUES ($1, $2) ON CONFLICT (company_id) WHERE company_id IS NOT NULL DO NOTHING",
      [companyId, companyRes.rows[0].name]
    );

    const usersRes = await client.query(
      `SELECT COUNT(*)::int AS count FROM users WHERE company_id = $1`,
      [companyId]
    );
    const currentUsers = Number(usersRes.rows[0]?.count || 0);
    if (currentUsers >= 1) {
      await client.query("ROLLBACK");
      return { error: "License Limit Reached: Please upgrade to add more users (300 THB/user/month)." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // สถานะ Active เพื่อให้ลูกค้าเข้าใช้งาน Trial ได้ทันทีแบบ self-service
    await client.query(
      "INSERT INTO users (name, email, password, role, status, company_id) VALUES ($1, $2, $3, $4, $5, $6)",
      [name, normalizedEmail, hashedPassword, "user", "Active", companyId]
    );

    await client.query("COMMIT");

    // Auto-install plugin pack based on business type (best-effort, outside tx)
    try {
      const { listPluginPacks } = await import("@/lib/plugin-packs");
      const { saveCompanyModuleOverrides } = await import("@/lib/module-config");
      const packId = getRegistrationPluginPack(businessType);
      if (packId) {
        const pack = listPluginPacks().find((p) => p.id === packId);
        if (pack) {
          const overrides: Record<string, boolean> = {};
          for (const m of pack.modules) overrides[m] = true;
          if (pack.dependencies) {
            for (const dep of pack.dependencies) {
              const depPack = listPluginPacks().find((p) => p.id === dep);
              if (depPack) for (const m of depPack.modules) overrides[m] = true;
            }
          }
          await saveCompanyModuleOverrides(companyId, overrides, 0);
        }
      }
    } catch (e) {
      console.error("auto-install pack error", e);
    }

    // Redirect to login on success
    return { success: true, company: companyRes.rows[0] };
  } catch (error: any) {
    try { await client.query("ROLLBACK"); } catch {}
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("❌ Registration error full details:", {
      message: err.message,
      stack: (error as Record<string, unknown>)?.stack,
      code: (error as Record<string, unknown>)?.code
    });
    return { error: `เกิดข้อผิดพลาด: ${err.message || "กรุณาลองใหม่อีกครั้ง"}` };
  } finally {
    client.release();
  }
}