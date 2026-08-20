import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { parseCheckoutItems, priceCartItems } from "@/lib/checkoutCart";
import { getStripeServerClient } from "@/lib/stripe";

function isCurrencyUnsupported(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return message.includes("currency") || message.includes("not supported");
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
        { error: "Authentication required to initiate Stripe test checkout." },
        { status: 401 }
      );
    }

    const stripe = getStripeServerClient();
    if (!stripe) {
      return NextResponse.json(
        {
          error: "Stripe Test Mode keys are not configured. Please add STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to your .env.local file.",
          notConfigured: true,
        },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => null);
    const items = parseCheckoutItems(body?.items);
    if (!items) {
      return NextResponse.json(
        { error: "Invalid cart payload. Add items to cart before proceeding." },
        { status: 400 }
      );
    }

    const priced = await priceCartItems(supabase, items);
    if (!priced.ok) {
      return NextResponse.json({ error: priced.error }, { status: priced.status });
    }

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: priced.cart.stripeAmount,
        currency: "lkr",
        automatic_payment_methods: {
          enabled: true,
        },
        description: `UN Tiles Architectural Order for ${user.email}`,
        receipt_email: user.email ?? undefined,
        metadata: {
          userId: user.id,
          userEmail: user.email || "",
          itemsSummary: priced.cart.itemSummaries.join(", ").slice(0, 450),
          totalAmountLKR: String(priced.cart.totalLKR),
          cartFingerprint: priced.cart.fingerprint,
          environment: "stripe_test_mode",
        },
      });

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amountLKR: priced.cart.totalLKR,
      });
    } catch (createError: unknown) {
      console.error("Stripe PaymentIntent creation error:", createError);
      if (isCurrencyUnsupported(createError)) {
        return NextResponse.json(
          {
            error: "This Stripe account does not have LKR enabled. Enable LKR in the Stripe Dashboard and try again.",
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Failed to initialize Stripe payment. Please try again." },
        { status: 500 }
      );
    }
  } catch (err: unknown) {
    console.error("Stripe PaymentIntent route error:", err);
    return NextResponse.json(
      { error: "Failed to initialize Stripe payment. Please try again." },
      { status: 500 }
    );
  }
}
