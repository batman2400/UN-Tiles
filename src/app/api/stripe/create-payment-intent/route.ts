import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getStripeServerClient } from "@/lib/stripe";

interface ItemPayload {
  product_id: string;
  quantity_sqft: number;
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
    if (!body || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: "Invalid cart payload. Add items to cart before proceeding." },
        { status: 400 }
      );
    }

    const items: ItemPayload[] = body.items;

    // Securely calculate total by querying catalog in database
    const productIds = items.map((i) => i.product_id);
    const { data: products, error: prodError } = await supabase
      .from("products")
      .select("id, name, price_per_sqft")
      .in("id", productIds);

    if (prodError || !products || products.length === 0) {
      return NextResponse.json(
        { error: "Failed to verify cart items with the catalog database." },
        { status: 400 }
      );
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    let totalLKR = 0;
    const itemSummaries: string[] = [];

    for (const item of items) {
      const prod = productMap.get(item.product_id);
      if (!prod) {
        return NextResponse.json(
          { error: `Product ${item.product_id} not found in catalog.` },
          { status: 404 }
        );
      }
      const lineTotal = Number(prod.price_per_sqft) * Number(item.quantity_sqft);
      totalLKR += lineTotal;
      itemSummaries.push(`${prod.name} (${item.quantity_sqft} sq ft)`);
    }

    if (totalLKR <= 0) {
      return NextResponse.json(
        { error: "Calculated cart total must be greater than zero." },
        { status: 400 }
      );
    }

    // Stripe expects amount in smallest currency unit (cents for LKR: multiply by 100)
    const stripeAmount = Math.round(totalLKR * 100);

    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: stripeAmount,
        currency: "lkr",
        automatic_payment_methods: {
          enabled: true,
        },
        description: `UN Tiles Architectural Order for ${user.email}`,
        receipt_email: user.email,
        metadata: {
          userId: user.id,
          userEmail: user.email || "",
          itemsSummary: itemSummaries.join(", ").slice(0, 450),
          totalAmountLKR: String(totalLKR),
          environment: "stripe_test_mode",
        },
      });
    } catch (currencyErr: unknown) {
      const errMsg = currencyErr instanceof Error ? currencyErr.message : "";
      if (errMsg.toLowerCase().includes("currency") || errMsg.toLowerCase().includes("not supported")) {
        // Fallback to USD if LKR is not configured on the Stripe account (approx 1 USD = 300 LKR)
        const usdAmount = Math.max(100, Math.round((totalLKR / 300) * 100));
        paymentIntent = await stripe.paymentIntents.create({
          amount: usdAmount,
          currency: "usd",
          automatic_payment_methods: {
            enabled: true,
          },
          description: `UN Tiles Architectural Order for ${user.email} (${totalLKR} LKR)`,
          receipt_email: user.email,
          metadata: {
            userId: user.id,
            userEmail: user.email || "",
            itemsSummary: itemSummaries.join(", ").slice(0, 450),
            totalAmountLKR: String(totalLKR),
            originalCurrency: "LKR",
            environment: "stripe_test_mode",
          },
        });
      } else {
        throw currencyErr;
      }
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amountLKR: totalLKR,
    });
  } catch (err: unknown) {
    console.error("Stripe PaymentIntent creation error:", err);
    const errorMsg = err instanceof Error ? err.message : "Failed to create Stripe payment intent.";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
