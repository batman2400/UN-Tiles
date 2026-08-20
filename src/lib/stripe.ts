import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeServerClient(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey || secretKey.startsWith("sk_test_your_")) {
    return null;
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      typescript: true,
      appInfo: {
        name: "UN Tiles Luxury Portal",
        version: "1.0.0",
      },
    });
  }

  return stripeClient;
}
