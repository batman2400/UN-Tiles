import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { CATALOG_CACHE_TAG, invalidateLocalCatalogCache } from "@/data/products";
import { parseCheckoutItems, priceCartItems } from "@/lib/checkoutCart";
import { getStripeServerClient } from "@/lib/stripe";

interface CheckoutRequestBody {
  items: unknown;
  deliveryMethod: string;
  addressId?: string | null;
  paymentMethod?: string;
  paymentIntentId?: string;
}

interface ProcessCheckoutResult {
  order_id: string;
  total: number;
  payment_status?: string;
  payment_method?: string;
}

const VALID_DELIVERY_METHODS = ["Cash on Delivery", "Pickup from Store", "Island-wide Delivery"];
const STRIPE_PAYMENT_METHODS = new Set(["Stripe (Test Mode)", "Stripe"]);
const OFFLINE_PAYMENT_METHODS = new Set([
  "Cash on Delivery",
  "Pickup from Store",
  "Pay at Showroom",
]);
const VALID_PAYMENT_METHODS = [...STRIPE_PAYMENT_METHODS, ...OFFLINE_PAYMENT_METHODS];
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PAYMENT_INTENT_ID_RE = /^pi_[a-zA-Z0-9]+$/;

function isValidCheckoutBody(body: unknown): body is CheckoutRequestBody {
  if (typeof body !== "object" || body === null) return false;
  const candidate = body as Record<string, unknown>;

  if (parseCheckoutItems(candidate.items) === null) return false;

  if (
    typeof candidate.deliveryMethod !== "string" ||
    !VALID_DELIVERY_METHODS.includes(candidate.deliveryMethod)
  ) {
    return false;
  }

  if (candidate.deliveryMethod === "Cash on Delivery" || candidate.deliveryMethod === "Island-wide Delivery") {
    if (typeof candidate.addressId !== "string" || !UUID_RE.test(candidate.addressId)) {
      return false;
    }
  }

  if (candidate.paymentMethod !== undefined) {
    if (typeof candidate.paymentMethod !== "string" || !VALID_PAYMENT_METHODS.includes(candidate.paymentMethod)) {
      return false;
    }
  }

  if (candidate.paymentIntentId !== undefined) {
    if (typeof candidate.paymentIntentId !== "string" || !PAYMENT_INTENT_ID_RE.test(candidate.paymentIntentId)) {
      return false;
    }
  }

  return true;
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

function defaultPaymentMethod(deliveryMethod: string): string {
  return deliveryMethod === "Cash on Delivery" ? "Cash on Delivery" : "Pickup from Store";
}

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
        { error: "Invalid cart or checkout data. Delivery requires a saved delivery address." },
        { status: 400 }
      );
    }

    const mappedItems = parseCheckoutItems(body.items);
    if (!mappedItems) {
      return NextResponse.json(
        { error: "Invalid cart data." },
        { status: 400 }
      );
    }

    const isDelivery = body.deliveryMethod === "Cash on Delivery" || body.deliveryMethod === "Island-wide Delivery";
    const requestedMethod = body.paymentMethod || defaultPaymentMethod(body.deliveryMethod);
    const isStripeCheckout = STRIPE_PAYMENT_METHODS.has(requestedMethod);

    let paymentMethod = requestedMethod;
    let paymentStatus = "Pending";
    let paymentDetails: Record<string, unknown> = {};

    if (isStripeCheckout) {
      const priced = await priceCartItems(supabase, mappedItems);
      if (!priced.ok) {
        return NextResponse.json({ error: priced.error }, { status: priced.status });
      }

      const stripe = getStripeServerClient();
      if (!stripe) {
        return NextResponse.json(
          { error: "Stripe is not configured. Online payment is unavailable." },
          { status: 503 }
        );
      }

      if (!body.paymentIntentId || !PAYMENT_INTENT_ID_RE.test(body.paymentIntentId)) {
        return NextResponse.json(
          { error: "A completed Stripe payment is required to place this order." },
          { status: 400 }
        );
      }

      let paymentIntent;
      try {
        paymentIntent = await stripe.paymentIntents.retrieve(body.paymentIntentId);
      } catch (retrieveError) {
        console.error("Stripe PaymentIntent retrieve failed:", retrieveError);
        return NextResponse.json(
          { error: "Could not verify Stripe payment. Please try again." },
          { status: 502 }
        );
      }

      if (paymentIntent.status !== "succeeded") {
        return NextResponse.json(
          { error: "Stripe payment has not completed. Please authorize the card again." },
          { status: 402 }
        );
      }

      if (paymentIntent.metadata.userId !== user.id) {
        return NextResponse.json(
          { error: "This Stripe payment does not belong to the signed-in account." },
          { status: 403 }
        );
      }

      if (paymentIntent.currency !== "lkr") {
        return NextResponse.json(
          { error: "Stripe payment currency does not match this order." },
          { status: 400 }
        );
      }

      if (paymentIntent.amount !== priced.cart.stripeAmount) {
        return NextResponse.json(
          { error: "Stripe payment amount does not match the current cart total." },
          { status: 400 }
        );
      }

      if (paymentIntent.metadata.cartFingerprint && paymentIntent.metadata.cartFingerprint !== priced.cart.fingerprint) {
        return NextResponse.json(
          { error: "Your cart changed after payment started. Please pay again." },
          { status: 409 }
        );
      }

      const { data: existingOrders, error: existingError } = await supabase
        .from("orders")
        .select("id")
        .eq("user_id", user.id)
        .filter("payment_details->>transaction_id", "eq", paymentIntent.id)
        .limit(1);

      if (existingError) {
        console.error("PaymentIntent reuse lookup failed:", existingError);
        return NextResponse.json(
          { error: "Could not verify payment uniqueness. Please try again." },
          { status: 500 }
        );
      }

      if (existingOrders && existingOrders.length > 0) {
        return NextResponse.json(
          { error: "This Stripe payment has already been used for an order." },
          { status: 409 }
        );
      }

      paymentMethod = "Stripe (Test Mode)";
      paymentStatus = "Paid";
      paymentDetails = {
        transaction_id: paymentIntent.id,
        auth_code: `STRIPE-${paymentIntent.id.slice(-6).toUpperCase()}`,
        payment_channel: "card",
        currency: "LKR",
        amount: priced.cart.totalLKR,
        paid_at: new Date(paymentIntent.created * 1000).toISOString(),
        environment: "stripe_test_mode",
      };
    } else {
      paymentStatus = "Pending";
      paymentDetails = {};
    }

    const { data, error } = await supabase.rpc("process_checkout", {
      p_user_id: user.id,
      p_items: mappedItems,
      p_delivery_method: body.deliveryMethod,
      p_address_id: isDelivery ? body.addressId : null,
      p_payment_method: paymentMethod,
      p_payment_status: paymentStatus,
      p_payment_details: paymentDetails,
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
      payment_status: data.payment_status || paymentStatus,
      payment_method: data.payment_method || paymentMethod,
    });
  } catch (error) {
    console.error("Unexpected checkout error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
