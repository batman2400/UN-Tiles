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
}

// ── Constants ──────────────────────────────────────────

const VALID_DELIVERY_METHODS = ["Cash on Delivery", "Pickup from Store"];

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

// ── Route Handler ──────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // 1. Initialize authenticated Supabase client
    const supabase = await createClient();

    // 2. Verify user session via cookie
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

    // 3. Parse and validate request body
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
        { error: "Invalid cart data. Each item must have a product_id (string) and quantity_sqft (positive number). A valid delivery method is required." },
        { status: 400 }
      );
    }

    // 4. Map to the format expected by the process_checkout RPC
    const mappedItems = body.items.map((item) => ({
      product_id: item.product_id,
      quantity_sqft: item.quantity_sqft,
    }));

    // 5. Manual checkout to bypass the RPC duplicate key issue
    // Fetch products to validate stock
    const productIds = mappedItems.map((i) => i.product_id);
    const { data: products, error: pError } = await supabase
      .from("products")
      .select("id, name, price_per_sqft, stock_sqft")
      .in("id", productIds);

    if (pError || !products) {
      return NextResponse.json(
        { error: "Failed to fetch products for checkout." },
        { status: 500 }
      );
    }

    let total = 0;
    let itemsSummary = "";

    // Validate stock for all items
    for (const item of mappedItems) {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.product_id} not found.` },
          { status: 404 }
        );
      }
      if (product.stock_sqft < item.quantity_sqft) {
        return NextResponse.json(
          {
            error: `Insufficient stock for "${product.name}". Available: ${product.stock_sqft} sq ft, Requested: ${item.quantity_sqft} sq ft`,
          },
          { status: 409 }
        );
      }
      total += product.price_per_sqft * item.quantity_sqft;

      if (itemsSummary !== "") itemsSummary += ", ";
      itemsSummary += `${product.name} (${item.quantity_sqft} sq ft)`;
    }

    // Generate a secure UUID for the order to avoid collisions
    const orderId = crypto.randomUUID();

    // Insert the order
    const { error: insertError } = await supabase.from("orders").insert({
      id: orderId,
      user_id: user.id,
      status: "Pending",
      total: total.toString(),
      items: itemsSummary,
      delivery_method: body.deliveryMethod,
    });

    if (insertError) {
      console.error("Order insert error:", insertError);
      return NextResponse.json(
        { error: "An error occurred during order creation." },
        { status: 500 }
      );
    }

    // Deduct stock (best-effort since JS client doesn't support transactions)
    for (const item of mappedItems) {
      const product = products.find((p) => p.id === item.product_id)!;
      await supabase
        .from("products")
        .update({ stock_sqft: product.stock_sqft - item.quantity_sqft })
        .eq("id", item.product_id);
    }

    // 7. Revalidate cached pages so stock is immediately accurate
    invalidateLocalCatalogCache();
    revalidateTag(CATALOG_CACHE_TAG, "max");
    revalidatePath("/");
    revalidatePath("/collections");

    // 8. Return success with order ID
    return NextResponse.json({
      success: true,
      order_id: orderId,
    });
  } catch (error) {
    console.error("Unexpected checkout error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
