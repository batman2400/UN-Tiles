import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { CATALOG_CACHE_TAG, invalidateLocalCatalogCache } from "@/data/products";

// ── Types ──────────────────────────────────────────────

interface CheckoutItem {
  product_id: string;
  quantity_sqft: number;
}

interface CheckoutRequestBody {
  items: CheckoutItem[];
  deliveryMethod: string;
  addressId?: string | null;
}

interface ProcessCheckoutResult {
  order_id: string;
  total: number;
}

// ── Constants ──────────────────────────────────────────

const VALID_DELIVERY_METHODS = ["Cash on Delivery", "Pickup from Store"];
const MAX_CHECKOUT_LINES = 50;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ── Validation ─────────────────────────────────────────

function isValidCheckoutBody(body: unknown): body is CheckoutRequestBody {
  if (typeof body !== "object" || body === null) return false;
  const candidate = body as Record<string, unknown>;

  if (!Array.isArray(candidate.items) || candidate.items.length === 0) return false;

  if (
    typeof candidate.deliveryMethod !== "string" ||
    !VALID_DELIVERY_METHODS.includes(candidate.deliveryMethod)
  ) {
    return false;
  }

  if (candidate.deliveryMethod === "Cash on Delivery") {
    if (typeof candidate.addressId !== "string" || !UUID_RE.test(candidate.addressId)) {
      return false;
    }
  }

  return candidate.items.every((item: unknown) => {
    if (typeof item !== "object" || item === null) return false;
    const entry = item as Record<string, unknown>;
    return (
      typeof entry.product_id === "string" &&
      entry.product_id.length > 0 &&
      typeof entry.quantity_sqft === "number" &&
      entry.quantity_sqft > 0 &&
      Number.isFinite(entry.quantity_sqft)
    );
  });
}

function mergeCheckoutItems(items: CheckoutItem[]): CheckoutItem[] {
  const merged = new Map<string, number>();
  for (const item of items) {
    merged.set(item.product_id, (merged.get(item.product_id) ?? 0) + item.quantity_sqft);
  }
  return [...merged.entries()].map(([product_id, quantity_sqft]) => ({
    product_id,
    quantity_sqft,
  }));
}

function isProcessCheckoutResult(value: unknown): value is ProcessCheckoutResult {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.order_id === "string" && candidate.order_id.length > 0;
}

function checkoutErrorResponse(message: string): NextResponse {
  const lower = message.toLowerCase();

  if (lower.includes("authentication required")) {
    return NextResponse.json({ error: message }, { status: 401 });
  }
  if (lower.includes("insufficient stock")) {
    return NextResponse.json({ error: message }, { status: 409 });
  }
  if (lower.includes("not found")) {
    return NextResponse.json({ error: message }, { status: 404 });
  }
  if (lower.includes("could not find the function") || lower.includes("schema cache")) {
    return NextResponse.json(
      { error: "Checkout is temporarily unavailable. Please try again shortly." },
      { status: 503 }
    );
  }
  if (lower.includes("duplicate key") || lower.includes("unique constraint")) {
    return NextResponse.json(
      { error: "Checkout could not complete. Please try again." },
      { status: 409 }
    );
  }
  if (lower.includes("delivery address")) {
    return NextResponse.json({ error: message }, { status: 400 });
  }
  if (lower.includes("invalid") || lower.includes("cart is empty")) {
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ error: message }, { status: 500 });
}

// ── Route Handler ──────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required. Please log in to complete your purchase." },
        { status: 401 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    if (!isValidCheckoutBody(body)) {
      return NextResponse.json(
        { error: "Invalid cart data. Cash on Delivery requires a saved delivery address." },
        { status: 400 }
      );
    }

    const mappedItems = mergeCheckoutItems(body.items);
    if (mappedItems.length === 0 || mappedItems.length > MAX_CHECKOUT_LINES) {
      return NextResponse.json(
        { error: "Invalid cart data." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc("process_checkout", {
      p_user_id: user.id,
      p_items: mappedItems,
      p_delivery_method: body.deliveryMethod,
      p_address_id: body.deliveryMethod === "Cash on Delivery" ? body.addressId : null,
    });

    if (error) {
      console.error("Checkout RPC error:", error);
      return checkoutErrorResponse(error.message || "Checkout failed.");
    }

    if (!isProcessCheckoutResult(data)) {
      console.error("Checkout RPC returned unexpected payload:", data);
      return NextResponse.json(
        { error: "An error occurred during order creation." },
        { status: 500 }
      );
    }

    invalidateLocalCatalogCache();
    revalidateTag(CATALOG_CACHE_TAG, "max");
    revalidatePath("/");
    revalidatePath("/collections");

    return NextResponse.json({
      success: true,
      order_id: data.order_id,
    });
  } catch (error) {
    console.error("Unexpected checkout error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
