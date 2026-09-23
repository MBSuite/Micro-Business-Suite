import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { query } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/core-standards";

export const dynamic = "force-dynamic";

const MAX_ROWS_PER_TABLE = 10000;
const MAX_BACKUP_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB limit for safety

/**
 * Encrypt payload using AES-256-GCM
 */
function encryptBackup(payload: string, keyHexOrString: string): { iv: string; authTag: string; data: string } {
  // Derive 32-byte key via SHA-256 to allow variable length secrets
  const key = crypto.createHash("sha256").update(keyHexOrString).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  
  let encrypted = cipher.update(payload, "utf8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag().toString("base64");

  return {
    iv: iv.toString("base64"),
    authTag,
    data: encrypted,
  };
}

/**
 * GET /api/admin/backup
 * 
 * PRIVILEGED ENDPOINT: Exports sanitized database backup
 * REQUIRES: authenticated admin or superadmin
 * 
 * Safety guards:
 *  - Password hash is strictly redacted ([REDACTED])
 *  - Size limits and row limits applied
 *  - Optional AES-256-GCM encryption with BACKUP_ENCRYPTION_KEY
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Verify user is authenticated
    const session = await auth();
    if (!session?.user) {
      console.warn(`[AUDIT] Unauthorized backup access attempt - not authenticated`);
      return NextResponse.json(
        { error: "Unauthorized — not authenticated" },
        { status: 401 }
      );
    }

    // 2. Verify user has admin access
    if (!canAccessAdmin(session.user.role)) {
      console.warn(`[AUDIT] Unauthorized backup access attempt - user ${session.user.email} (role: ${session.user.role}) denied`);
      return NextResponse.json(
        { error: "Forbidden — admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "json";
    const requestedEncryption = searchParams.get("encrypt") === "true";

    // 3. Check encryption configuration if requested
    const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
    if (requestedEncryption && !encryptionKey) {
      return NextResponse.json(
        { error: "Encryption requested but BACKUP_ENCRYPTION_KEY is not configured in server environment" },
        { status: 400 }
      );
    }

    // 4. Log audit trail before exporting
    const timestamp = new Date().toISOString();
    console.log(`[AUDIT] Database backup initiated by admin: ${session.user.email} (ID: ${session.user.id}) at ${timestamp} (encrypted: ${requestedEncryption})`);

    const tables = [
      "company_settings",
      "chart_of_accounts",
      "journal_entries",
      "expenses",
      "invoices",
      "invoice_items",
      "contacts",
      "users",
      "groups",
      "group_permissions",
      "user_groups",
      "payments",
      "payment_vouchers",
      "document_patterns",
      "payroll_entries",
      "services",
    ];

    const backupData: Record<string, Array<Record<string, unknown>>> = {};
    let totalRowCount = 0;

    for (const table of tables) {
      try {
        const res = await query(`SELECT * FROM ${table} ORDER BY id ASC LIMIT $1`, [MAX_ROWS_PER_TABLE]);
        let rows = res.rows as Array<Record<string, unknown>>;

        // CRITICAL SAFETY: Never export password hashes
        if (table === "users") {
          rows = rows.map((u) => {
            const sanitized = { ...u };
            if ("password" in sanitized) {
              sanitized.password = "[REDACTED]";
            }
            return sanitized;
          });
        }

        backupData[table] = rows;
        totalRowCount += rows.length;
      } catch (err) {
        console.warn(`Backup table ${table} unavailable or skipped:`, err instanceof Error ? err.message : err);
        backupData[table] = [];
      }
    }

    // Format output
    let outputContent: string;
    let contentType = "application/json";
    let filename = `backup_${Date.now()}`;

    if (format === "json") {
      const payloadObj = {
        meta: {
          app: "Micro Business Suite",
          version: "0.1.0",
          exported_at: timestamp,
          exported_by: session.user.email,
          total_tables: tables.length,
          total_rows: totalRowCount,
          passwords_redacted: true,
        },
        tables: backupData,
      };
      outputContent = JSON.stringify(payloadObj, null, 2);
      filename += ".json";
    } else {
      contentType = "text/sql";
      filename += ".sql";
      let sqlContent = `-- Micro Business Suite Database Backup (Sanitized)\n-- Date: ${timestamp}\n-- Exported by: ${session.user.email}\n-- Notice: Password hashes are redacted\n\nBEGIN;\n\n`;

      for (const table of tables) {
        if (!backupData[table] || backupData[table].length === 0) continue;

        sqlContent += `-- Table: ${table}\n`;
        const columns = Object.keys(backupData[table][0]);

        for (const row of backupData[table]) {
          const values = columns.map((col) => {
            const val = row[col];
            if (val === null || val === undefined) return "NULL";
            if (typeof val === "number") return val;
            if (val instanceof Date) return `'${val.toISOString()}'`;
            if (typeof val === "object") return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
            return `'${String(val).replace(/'/g, "''")}'`;
          });

          sqlContent += `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${values.join(", ")}) ON CONFLICT DO NOTHING;\n`;
        }
        sqlContent += "\n";
      }

      sqlContent += "COMMIT;\n";
      outputContent = sqlContent;
    }

    // Check size limit
    const byteLength = Buffer.byteLength(outputContent, "utf8");
    if (byteLength > MAX_BACKUP_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: "Backup payload exceeds HTTP safety limit (25 MB). Please use offline backup script: scripts/auto-backup.mjs",
          sizeBytes: byteLength,
        },
        { status: 413 }
      );
    }

    // Apply encryption if requested
    if (requestedEncryption && encryptionKey) {
      const encrypted = encryptBackup(outputContent, encryptionKey);
      const encryptedPayload = JSON.stringify({
        kind: "micro-business-suite-encrypted-backup",
        algorithm: "aes-256-gcm",
        createdAt: timestamp,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        data: encrypted.data,
      });

      return new NextResponse(encryptedPayload, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename=backup_encrypted_${Date.now()}.enc.json`,
        },
      });
    }

    return new NextResponse(outputContent, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename=${filename}`,
      },
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Unknown backup error";
    console.error(`[ERROR] Backup operation failed:`, errorMsg);
    return NextResponse.json(
      { error: "Backup operation failed", details: errorMsg },
      { status: 500 }
    );
  }
}
