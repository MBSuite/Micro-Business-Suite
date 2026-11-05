// lib/loyalty.ts
import { query } from "@/lib/db";

export type Tier = "bronze" | "silver" | "gold" | "platinum";

export function computeTier(lifetimePoints: number): Tier {
  if (lifetimePoints >= 20000) return "platinum";
  if (lifetimePoints >= 5000) return "gold";
  if (lifetimePoints >= 1000) return "silver";
  return "bronze";
}

export const POINTS_PER_BAHT = 0.01; // 1 point per 100 baht

export async function getOrCreateAccount(companyId: number, contactId: number) {
  const { rows } = await query(
    `SELECT * FROM loyalty_accounts WHERE company_id = $1 AND contact_id = $2`,
    [companyId, contactId]
  );
  if (rows.length > 0) return rows[0];
  const { rows: ins } = await query(
    `INSERT INTO loyalty_accounts (company_id, contact_id, tier) VALUES ($1,$2,'bronze') RETURNING *`,
    [companyId, contactId]
  );
  return ins[0];
}

export async function accruePoints(companyId: number, contactId: number, invoiceId: number, amount: number, createdBy: number | null) {
  const account = await getOrCreateAccount(companyId, contactId);
  const points = Math.floor(amount * POINTS_PER_BAHT);
  if (points <= 0) return { points: 0, account };
  const newBalance = Number(account.points_balance) + points;
  const newLifetime = Number(account.lifetime_points) + points;
  const newTotalSpent = Number(account.total_spent) + amount;
  const tier = computeTier(newLifetime);
  await query(
    `UPDATE loyalty_accounts SET points_balance=$1, lifetime_points=$2, total_spent=$3, tier=$4, updated_at=NOW() WHERE id=$5`,
    [newBalance, newLifetime, newTotalSpent, tier, account.id]
  );
  await query(
    `INSERT INTO loyalty_transactions (company_id, account_id, tx_type, points, balance_after, reference_type, reference_id, description, created_by)
     VALUES ($1,$2,'earn',$3,$4,'invoice',$5,$6,$7)`,
    [companyId, account.id, points, newBalance, invoiceId, `ซื้อสินค้า ฿${amount.toFixed(2)}`, createdBy]
  );
  return { points, account: { ...account, points_balance: newBalance, lifetime_points: newLifetime, tier } };
}

export async function redeemPoints(companyId: number, contactId: number, points: number, invoiceId: number | null, createdBy: number | null) {
  const account = await getOrCreateAccount(companyId, contactId);
  if (Number(account.points_balance) < points) throw new Error("คะแนนไม่พอ");
  const newBalance = Number(account.points_balance) - points;
  await query(`UPDATE loyalty_accounts SET points_balance=$1, updated_at=NOW() WHERE id=$2`, [newBalance, account.id]);
  await query(
    `INSERT INTO loyalty_transactions (company_id, account_id, tx_type, points, balance_after, reference_type, reference_id, description, created_by)
     VALUES ($1,$2,'redeem',$3,$4,'invoice',$5,$6,$7)`,
    [companyId, account.id, -points, newBalance, invoiceId, `ใช้คะแนน ${points}`, createdBy]
  );
  return { points, balance: newBalance };
}
