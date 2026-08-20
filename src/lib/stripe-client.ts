import { loadStripe, Stripe as StripeClientInstance } from "@stripe/stripe-js";

let stripePromise: Promise<StripeClientInstance | null> | null = null;

export function getStripeClient(): Promise<StripeClientInstance | null> | null {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();

  if (!publishableKey || publishableKey.startsWith("pk_test_your_")) {
    return null;
  }

  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }

  return stripePromise;
}
