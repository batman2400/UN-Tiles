import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

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

    // 5. Execute the ACID-compliant checkout via RPC
    //    The process_checkout PL/pgSQL function handles:
    //    - Row-level locking (SELECT ... FOR UPDATE)
    //    - Stock validation & deduction
    //    - Order creation with delivery method
    //    All within a single database transaction.
    const { data, error: rpcError } = await supabase.rpc("process_checkout", {
      p_user_id: user.id,
      p_items: mappedItems,
      p_delivery_method: body.deliveryMethod,
    });

    if (rpcError) {
      // Check for specific stock-related errors
      const message = rpcError.message?.toLowerCase() ?? "";
      if (
        message.includes("insufficient") ||
        message.includes("stock") ||
        message.includes("out of stock") ||
        message.includes("not enough")
      ) {
        return NextResponse.json(
          { error: rpcError.message },
          { status: 409 }
        );
      }

      console.error("Checkout RPC error:", rpcError);
      return NextResponse.json(
        { error: rpcError.message || "An error occurred during checkout." },
        { status: 409 }
      );
    }

    // 6. Extract order ID from the RPC result
    const orderId =
      typeof data === "object" && data !== null && "order_id" in data
        ? (data as { order_id: string }).order_id
        : data;

    // 7. Revalidate cached pages so stock is immediately accurate
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
