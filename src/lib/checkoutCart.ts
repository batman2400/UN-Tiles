import type { SupabaseClient } from "@supabase/supabase-js";

export const MAX_CHECKOUT_LINES = 50;
export const MAX_QUANTITY_SQFT = 100_000;

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
    Number.isInteger(entry.quantity_sqft) &&
    entry.quantity_sqft >= 1 &&
    entry.quantity_sqft <= MAX_QUANTITY_SQFT
  );
}

export function parseCheckoutItems(raw: unknown): CheckoutLine[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  if (!raw.every(isValidCheckoutLine)) return null;
  const merged = mergeCheckoutItems(raw);
  if (merged.length === 0 || merged.length > MAX_CHECKOUT_LINES) return null;
  if (
    !merged.every(
      (item) =>
        Number.isInteger(item.quantity_sqft) &&
        item.quantity_sqft >= 1 &&
        item.quantity_sqft <= MAX_QUANTITY_SQFT
    )
  ) {
    return null;
  }
  return merged;
}

function hashString(str: string): string {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

export function cartFingerprint(items: CheckoutLine[]): string {
  const joined = [...items]
    .map((item) => `${item.product_id}:${item.quantity_sqft}`)
    .sort()
    .join("|");
  return `${joined.slice(0, 400)}#${hashString(joined)}`;
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
    .select("id, name, price_per_sqft, stock_sqft")
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

    const availableStock = Number(product.stock_sqft);
    if (!Number.isFinite(availableStock) || availableStock < item.quantity_sqft) {
      return {
        ok: false,
        error: `Insufficient stock for "${product.name}". Available: ${Number.isFinite(availableStock) ? availableStock : 0} sq ft, Requested: ${item.quantity_sqft} sq ft`,
        status: 409,
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
