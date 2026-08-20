import type { SupabaseClient } from "@supabase/supabase-js";

export const MAX_CHECKOUT_LINES = 50;

export type CheckoutLine = {
  product_id: string;
  quantity_sqft: number;
};

export type PricedCart = {
  totalLKR: number;
  itemSummaries: string[];
  fingerprint: string;
  stripeAmount: number;
};

export function mergeCheckoutItems(items: CheckoutLine[]): CheckoutLine[] {
  const merged = new Map<string, number>();
  for (const item of items) {
    merged.set(item.product_id, (merged.get(item.product_id) ?? 0) + item.quantity_sqft);
  }
  return [...merged.entries()].map(([product_id, quantity_sqft]) => ({
    product_id,
    quantity_sqft,
  }));
}

export function isValidCheckoutLine(item: unknown): item is CheckoutLine {
  if (typeof item !== "object" || item === null) return false;
  const entry = item as Record<string, unknown>;
  return (
    typeof entry.product_id === "string" &&
    entry.product_id.length > 0 &&
    typeof entry.quantity_sqft === "number" &&
    entry.quantity_sqft > 0 &&
    Number.isFinite(entry.quantity_sqft)
  );
}

export function parseCheckoutItems(raw: unknown): CheckoutLine[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  if (!raw.every(isValidCheckoutLine)) return null;
  const merged = mergeCheckoutItems(raw);
  if (merged.length === 0 || merged.length > MAX_CHECKOUT_LINES) return null;
  return merged;
}

export function cartFingerprint(items: CheckoutLine[]): string {
  return [...items]
    .map((item) => `${item.product_id}:${item.quantity_sqft}`)
    .sort()
    .join("|")
    .slice(0, 450);
}

export function lkrToStripeAmount(totalLKR: number): number {
  return Math.round(totalLKR * 100);
}

export async function priceCartItems(
  supabase: SupabaseClient,
  items: CheckoutLine[]
): Promise<{ ok: true; cart: PricedCart } | { ok: false; error: string; status: number }> {
  const productIds = items.map((item) => item.product_id);
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, price_per_sqft")
    .in("id", productIds);

  if (error || !products || products.length === 0) {
    return {
      ok: false,
      error: "Failed to verify cart items with the catalog.",
      status: 400,
    };
  }

  const productMap = new Map(products.map((product) => [product.id, product]));
  let totalLKR = 0;
  const itemSummaries: string[] = [];

  for (const item of items) {
    const product = productMap.get(item.product_id);
    if (!product) {
      return {
        ok: false,
        error: "A cart item is no longer available.",
        status: 404,
      };
    }

    const unitPrice = Number(product.price_per_sqft);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      return {
        ok: false,
        error: "Unable to price the cart. Please try again.",
        status: 400,
      };
    }

    totalLKR += unitPrice * item.quantity_sqft;
    itemSummaries.push(`${product.name} (${item.quantity_sqft} sq ft)`);
  }

  if (!Number.isFinite(totalLKR) || totalLKR <= 0) {
    return {
      ok: false,
      error: "Calculated cart total must be greater than zero.",
      status: 400,
    };
  }

  return {
    ok: true,
    cart: {
      totalLKR,
      itemSummaries,
      fingerprint: cartFingerprint(items),
      stripeAmount: lkrToStripeAmount(totalLKR),
    },
  };
}
