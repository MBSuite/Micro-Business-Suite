import "server-only";
import { query } from "@/lib/db";
import { isModuleName, normalizeShopCode, toIso } from "@/lib/module-link-validation.mjs";

/**
 * Core side of optional module linking (ADR-0006).
 *
 * A Core admin issues a one-time code bound to (module, core company). A module
 * admin enters the code and the module calls back with its shop code; only then
 * is the mapping stored. Revocation keeps history instead of deleting rows.
 */

export type ModuleLinkRow = {
  id: number;
  module: string;
  shop_code: string;
  shop_name: string;
  owner_email: string | null;
  core_company_id: number;
  status: string;
  linked_at: Date | string;
  revoked_at: Date | string | null;
  revoke_reason: string | null;
};

export class ModuleLinkError extends Error {
  status: number;
  code: string;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "ModuleLinkError";
    this.code = code;
    this.status = status;
  }
}

export function assertModule(value: unknown): string {
  if (!isModuleName(value)) {
    throw new ModuleLinkError(
      "MODULE_INVALID",
      "module must be one of retail, rental, pharmacy, hotel, fnb, service"
    );
  }
  return value as string;
}

export function assertShopCode(value: unknown): string {
  const shopCode = normalizeShopCode(value as string | number);
  if (!shopCode) {
    throw new ModuleLinkError(
      "SHOP_CODE_INVALID",
      "shop_code must be a positive company id or a shop code like R7K2M9A"
    );
  }
  return shopCode;
}

export async function getCompanyName(companyId: number): Promise<string> {
  const { rows } = await query(`SELECT name FROM companies WHERE id = $1 LIMIT 1`, [companyId]);
  return String(rows[0]?.name ?? "");
}

export async function findActiveLink(module: string, shopCode: string): Promise<ModuleLinkRow | null> {
  const { rows } = await query(
    `SELECT * FROM module_links
     WHERE module = $1 AND shop_code = $2 AND status = 'active'
     LIMIT 1`,
    [module, shopCode]
  );
  return (rows[0] as ModuleLinkRow) ?? null;
}

export async function findLatestLink(module: string, shopCode: string): Promise<ModuleLinkRow | null> {
  const { rows } = await query(
    `SELECT * FROM module_links
     WHERE module = $1 AND shop_code = $2
     ORDER BY (status = 'active') DESC, created_at DESC
     LIMIT 1`,
    [module, shopCode]
  );
  return (rows[0] as ModuleLinkRow) ?? null;
}

export type ClaimedLink = {
  companyId: number;
  companyName: string;
  linkedAt: string;
  idempotent: boolean;
};

/**
 * Claims a link code inside a single transaction. The code row is locked so
 * two concurrent module requests cannot both consume it.
 */
export async function claimLinkCode(params: {
  codeHash: string;
  module: string;
  shopCode: string;
  shopName: string;
  ownerEmail?: string | null;
}): Promise<ClaimedLink> {
  const { codeHash, module, shopCode, shopName, ownerEmail } = params;
  const pool = (await import("@/lib/db")).default;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows: codeRows } = await client.query(
      `SELECT id, module, core_company_id, expires_at, used_at
       FROM bridge_link_codes
       WHERE code_hash = $1
       FOR UPDATE`,
      [codeHash]
    );
    const codeRow = codeRows[0];
    if (!codeRow) {
      throw new ModuleLinkError("LINK_CODE_INVALID", "link code ไม่ถูกต้องหรือไม่พบ", 400);
    }
    if (codeRow.used_at) {
      throw new ModuleLinkError("LINK_CODE_USED", "link code นี้ถูกใช้ไปแล้ว", 409);
    }
    if (new Date(codeRow.expires_at).getTime() <= Date.now()) {
      throw new ModuleLinkError("LINK_CODE_EXPIRED", "link code หมดอายุแล้ว — ให้ Core ออกใหม่", 410);
    }
    if (codeRow.module !== module) {
      throw new ModuleLinkError("LINK_MODULE_MISMATCH", "link code ถูกออกให้โมดูลอื่น", 403);
    }

    const coreCompanyId = Number(codeRow.core_company_id);

    const { rows: existingShop } = await client.query(
      `SELECT * FROM module_links
       WHERE module = $1 AND shop_code = $2 AND status = 'active'
       LIMIT 1`,
      [module, shopCode]
    );
    if (existingShop[0]) {
      if (Number(existingShop[0].core_company_id) === coreCompanyId) {
        // Same shop, same company: treat as a successful retry but still burn the code.
        await client.query(`UPDATE bridge_link_codes SET used_at = CURRENT_TIMESTAMP WHERE id = $1`, [
          codeRow.id,
        ]);
        const companyRes = await client.query(`SELECT name FROM companies WHERE id = $1 LIMIT 1`, [
          coreCompanyId,
        ]);
        await client.query("COMMIT");
        return {
          companyId: coreCompanyId,
          companyName: String(companyRes.rows[0]?.name ?? ""),
          linkedAt: toIso(existingShop[0].linked_at) as string,
          idempotent: true,
        };
      }
      throw new ModuleLinkError(
        "LINK_ALREADY_ACTIVE",
        "ร้านนี้เชื่อมกับบริษัทอื่นอยู่แล้ว — ยกเลิกการเชื่อมเดิมก่อน",
        409
      );
    }

    const { rows: companyLinks } = await client.query(
      `SELECT shop_code FROM module_links
       WHERE module = $1 AND core_company_id = $2 AND status = 'active'
       LIMIT 1`,
      [module, coreCompanyId]
    );
    if (companyLinks[0]) {
      throw new ModuleLinkError(
        "LINK_ALREADY_ACTIVE",
        `บริษัทนี้เชื่อมกับร้าน ${companyLinks[0].shop_code} ในโมดูลนี้อยู่แล้ว`,
        409
      );
    }

    const { rows: inserted } = await client.query(
      `INSERT INTO module_links
         (module, shop_code, shop_name, owner_email, core_company_id, status, linked_at)
       VALUES ($1, $2, $3, $4, $5, 'active', CURRENT_TIMESTAMP)
       RETURNING linked_at`,
      [module, shopCode, shopName, ownerEmail || null, coreCompanyId]
    );

    await client.query(`UPDATE bridge_link_codes SET used_at = CURRENT_TIMESTAMP WHERE id = $1`, [
      codeRow.id,
    ]);
    const companyRes = await client.query(`SELECT name FROM companies WHERE id = $1 LIMIT 1`, [
      coreCompanyId,
    ]);
    await client.query("COMMIT");

    return {
      companyId: coreCompanyId,
      companyName: String(companyRes.rows[0]?.name ?? ""),
      linkedAt: toIso(inserted[0]?.linked_at) as string,
      idempotent: false,
    };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore rollback failure */
    }
    throw error;
  } finally {
    client.release();
  }
}

/** Revokes an active link by (module, shop_code). Returns the revoked row. */
export async function revokeLink(params: {
  module: string;
  shopCode: string;
  reason?: string | null;
  coreCompanyId?: number | null;
}): Promise<ModuleLinkRow> {
  const { module, shopCode, reason, coreCompanyId } = params;
  const paramsList: unknown[] = [module, shopCode];
  let companyFilter = "";
  if (coreCompanyId != null) {
    paramsList.push(coreCompanyId);
    companyFilter = ` AND core_company_id = $${paramsList.length}`;
  }

  const { rows } = await query(
    `UPDATE module_links
     SET status = 'revoked',
         revoked_at = CURRENT_TIMESTAMP,
         revoke_reason = $${paramsList.length + 1},
         updated_at = CURRENT_TIMESTAMP
     WHERE module = $1 AND shop_code = $2 AND status = 'active'${companyFilter}
     RETURNING *`,
    [...paramsList, reason || null]
  );
  const row = rows[0] as ModuleLinkRow | undefined;
  if (!row) {
    throw new ModuleLinkError("LINK_NOT_FOUND", "ไม่พบการเชื่อมที่ยังใช้งานอยู่", 404);
  }
  return row;
}
