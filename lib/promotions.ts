// lib/promotions.ts
// =====================================================
// Micro Business Suite: Promotions Rules Engine
// ประเมินโปรโมชันที่ใช้ได้กับตะกร้า และคำนวณส่วนลด
// =====================================================

import { query } from "@/lib/db";

export type PromoType = "percentage" | "fixed" | "bogo" | "bundle";

export interface Promotion {
  id: number;
  company_id: number;
  code: string | null;
  name: string;
  description: string | null;
  promo_type: PromoType;
  value: number;
  min_purchase: number;
  max_discount: number | null;
  applies_to: "all" | "products" | "categories";
  applies_ids: string | null;
  starts_at: string | null;
  ends_at: string | null;
  usage_limit: number | null;
  usage_count: number;
  is_active: boolean;
}

export interface CartLine {
  productId: number | null;
  qty: number;
  price: number;
}

function applicableIds(promo: Promotion): number[] {
  if (!promo.applies_ids) return [];
  return promo.applies_ids.split(",").map((s) => Number(s.trim())).filter((n) => !isNaN(n));
}

function appliesToLine(promo: Promotion, line: CartLine, productCategoryMap: Map<number, number>): boolean {
  if (promo.applies_to === "all") return true;
  const ids = applicableIds(promo);
  if (promo.applies_to === "products") {
    return line.productId !== null && ids.includes(line.productId);
  }
  if (promo.applies_to === "categories") {
    const cat = line.productId !== null ? productCategoryMap.get(line.productId) : undefined;
    return cat !== undefined && ids.includes(cat);
  }
  return true;
}

function isActiveNow(promo: Promotion): boolean {
  if (!promo.is_active) return false;
  const now = Date.now();
  if (promo.starts_at && new Date(promo.starts_at).getTime() > now) return false;
  if (promo.ends_at && new Date(promo.ends_at).getTime() < now) return false;
  if (promo.usage_limit !== null && promo.usage_count >= promo.usage_limit) return false;
  return true;
}

export async function fetchActivePromotions(companyId: number): Promise<Promotion[]> {
  const { rows } = await query(
    `SELECT * FROM promotions WHERE company_id = $1 AND is_active = TRUE`,
    [companyId]
  );
  return rows as Promotion[];
}

// คำนวณส่วนลดที่ดีที่สุดสำหรับตะกร้า
export async function evaluateBestPromotion(
  companyId: number,
  cart: CartLine[],
  subtotal: number
): Promise<{ promotion: Promotion | null; discount: number; description: string }> {
  const promos = await fetchActivePromotions(companyId);
  // product -> category map
  const productIds = cart.map((c) => c.productId).filter((x): x is number => x !== null);
  const catMap = new Map<number, number>();
  if (productIds.length > 0) {
    const { rows } = await query(
      `SELECT id, category_id FROM products WHERE company_id = $1 AND id = ANY($2::int[])`,
      [companyId, productIds]
    );
    for (const r of rows) catMap.set(Number(r.id), Number(r.category_id));
  }

  let best: { promotion: Promotion; discount: number } | null = null;

  for (const promo of promos) {
    if (!isActiveNow(promo)) continue;
    if (subtotal < Number(promo.min_purchase || 0)) continue;

    // determine applicable subtotal
    let applicableSubtotal = 0;
    if (promo.applies_to === "all") {
      applicableSubtotal = subtotal;
    } else {
      applicableSubtotal = cart
        .filter((l) => appliesToLine(promo, l, catMap))
        .reduce((s, l) => s + l.qty * l.price, 0);
    }
    if (applicableSubtotal <= 0 && promo.applies_to !== "all") continue;

    let discount = 0;
    if (promo.promo_type === "percentage") {
      discount = (applicableSubtotal * Number(promo.value)) / 100;
    } else if (promo.promo_type === "fixed") {
      discount = Number(promo.value);
    } else if (promo.promo_type === "bogo") {
      // buy X get Y free: value = buy qty, max_discount = free qty (reuse max_discount as free qty? use value as buy, 1 free)
      // simplified: for each applicable line, free floor(qty/2) items at price
      discount = cart
        .filter((l) => appliesToLine(promo, l, catMap))
        .reduce((s, l) => s + Math.floor(l.qty / 2) * l.price, 0);
    } else if (promo.promo_type === "bundle") {
      // bundle: value = bundle price for whole applicable subtotal? simplified fixed discount
      discount = Number(promo.value);
    }

    if (promo.max_discount !== null && discount > Number(promo.max_discount)) {
      discount = Number(promo.max_discount);
    }
    if (discount > subtotal) discount = subtotal;
    if (discount <= 0) continue;

    if (!best || discount > best.discount) {
      best = { promotion: promo, discount };
    }
  }

  if (!best) return { promotion: null, discount: 0, description: "" };
  return {
    promotion: best.promotion,
    discount: best.discount,
    description: `${best.promotion.name}${best.promotion.code ? ` (${best.promotion.code})` : ""}`,
  };
}

export async function incrementUsage(promotionId: number): Promise<void> {
  await query(`UPDATE promotions SET usage_count = usage_count + 1, updated_at = NOW() WHERE id = $1`, [promotionId]);
}
