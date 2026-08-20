"use client";

import { useState, useEffect, FormEvent, useMemo } from "react";
import { 
  Lock, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  X, 
  ArrowRight, 
  Copy, 
  Check, 
  KeyRound, 
  ExternalLink 
} from "lucide-react";
import { 
  Elements, 
  PaymentElement, 
  useStripe, 
  useElements 
} from "@stripe/react-stripe-js";
import type { Appearance, StripeElementsOptions } from "@stripe/stripe-js";
import { getStripeClient } from "@/lib/stripe-client";

interface StripePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Array<{ id: string; cartQuantitySqft: number }>;
  totalAmount: number;
  fulfillmentMethod: "pickup" | "delivery";
  addressId: string | null;
  onPaymentSuccess: (paymentIntentId: string) => Promise<void> | void;
  onFallbackToSandbox?: () => void;
}

const STRIPE_TEST_CARDS = [
  {
    name: "Standard Pass",
    number: "4242 4242 4242 4242",
    badge: "Instant 3DS Pass",
    desc: "Passes instant authorization without 3DS challenge",
  },
  {
    name: "3D Secure",
    number: "4000 0027 6000 3184",
    badge: "3DS Auth Test",
    desc: "Triggers Stripe 3D Secure modal challenge",
  },
  {
    name: "Decline Test",
    number: "4000 0000 0000 0002",
    badge: "Card Declined",
    desc: "Tests generic decline & error handling",
  },
];

function formatCurrency(val: number): string {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

function stripeReturnUrl(fulfillmentMethod: "pickup" | "delivery", addressId: string | null): string {
  const url = new URL("/cart", window.location.origin);
  url.searchParams.set("stripe", "return");
  url.searchParams.set("fulfillment", fulfillmentMethod);
  if (addressId) {
    url.searchParams.set("addressId", addressId);
  }
  return url.toString();
}

function StripePaymentFormInner({
  totalAmount,
  paymentIntentId,
  fulfillmentMethod,
  addressId,
  onPaymentSuccess,
  onCancel,
}: {
  totalAmount: number;
  paymentIntentId: string;
  fulfillmentMethod: "pickup" | "delivery";
  addressId: string | null;
  onPaymentSuccess: (paymentIntentId: string) => Promise<void> | void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  const handleCopyCard = (num: string) => {
    void navigator.clipboard.writeText(num.replace(/\s/g, ""));
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: stripeReturnUrl(fulfillmentMethod, addressId),
        },
        redirect: "if_required",
      });

      if (result.error) {
        setErrorMessage(result.error.message || "Stripe test card authorization failed.");
        setIsProcessing(false);
        return;
      }

      if (result.paymentIntent?.status === "succeeded") {
        try {
          await onPaymentSuccess(result.paymentIntent.id);
          setIsSuccess(true);
        } catch (err: unknown) {
          console.error("Failed to complete order callback after Stripe payment:", err);
          setErrorMessage(
            err instanceof Error
              ? err.message
              : "Payment succeeded in Stripe, but order creation failed. Please contact support."
          );
        } finally {
          setIsProcessing(false);
        }
        return;
      }

      if (result.paymentIntent?.status === "processing") {
        setErrorMessage("Payment is still processing. Please wait a moment and try again.");
        setIsProcessing(false);
        return;
      }

      setErrorMessage("Payment did not complete. Please try again.");
      setIsProcessing(false);
    } catch (err: unknown) {
      console.error("Unexpected Stripe confirm error:", err);
      setErrorMessage("An unexpected error occurred during Stripe confirmation.");
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="py-6 sm:py-8 text-center space-y-6 animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 mx-auto bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-200">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Payment confirmed
          </span>
          <h3 className="text-2xl font-display font-bold text-zinc-900 mt-3">
            Order placed
          </h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
            Stripe Test Mode authorized the payment and your studio order has been saved.
          </p>
        </div>

        <div className="max-w-md mx-auto bg-[#faf8f5] border border-gray-100 rounded-2xl p-4 sm:p-5 text-left space-y-3 font-mono text-xs">
          <div className="flex justify-between pb-2 border-b border-gray-200 text-gray-500">
            <span>PaymentIntent ID</span>
            <span className="text-zinc-900 font-bold break-all text-right ml-3">{paymentIntentId}</span>
          </div>
          <div className="flex justify-between pb-2 border-b border-gray-200 text-gray-500">
            <span>Provider</span>
            <span className="text-zinc-900">Stripe Test Mode</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Amount paid</span>
            <span className="text-zinc-900 font-bold">{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="w-full max-w-md bg-zinc-900 text-white hover:bg-yellow-500 hover:text-black font-semibold uppercase tracking-widest py-4 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <span>View order in account</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-yellow-600" />
            Stripe test cards
          </span>
          <span className="text-[10px] text-gray-400">Click to copy</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {STRIPE_TEST_CARDS.map((card) => (
            <button
              key={card.number}
              type="button"
              onClick={() => handleCopyCard(card.number)}
              className="p-3 rounded-2xl border border-gray-200 bg-[#faf8f5] hover:border-yellow-500 hover:bg-yellow-50/50 text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-800 border border-yellow-200">
                  {card.badge}
                </span>
                {copiedNumber === card.number ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-gray-400 group-hover:text-zinc-700" />
                )}
              </div>
              <p className="text-xs font-mono font-bold text-zinc-900">{card.number}</p>
              <p className="text-[10px] text-gray-500 mt-0.5 truncate">{card.name}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 bg-[#faf8f5] border border-gray-100 rounded-2xl">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-red-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p className="font-semibold">{errorMessage}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-zinc-900 text-white hover:bg-yellow-500 hover:text-black font-semibold uppercase tracking-widest py-4 rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs">Authorizing payment...</span>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            <span>Pay {formatCurrency(totalAmount)}</span>
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Card details stay with Stripe · {paymentIntentId.slice(0, 16)}…</span>
      </div>
    </form>
  );
}

export function StripePaymentModal({
  isOpen,
  onClose,
  items,
  totalAmount,
  fulfillmentMethod,
  addressId,
  onPaymentSuccess,
  onFallbackToSandbox,
}: StripePaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isLoadingIntent, setIsLoadingIntent] = useState(false);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [isNotConfigured, setIsNotConfigured] = useState(false);

  const stripePromise = getStripeClient();
  const cartKey = useMemo(
    () => items.map((item) => `${item.id}:${item.cartQuantitySqft}`).join("|"),
    [items]
  );

  useEffect(() => {
    if (!isOpen || items.length === 0) {
      setClientSecret(null);
      setPaymentIntentId(null);
      setIntentError(null);
      setIsNotConfigured(false);
      return;
    }

    if (!stripePromise) {
      setIsNotConfigured(true);
      return;
    }

    let cancelled = false;

    const fetchPaymentIntent = async () => {
      setIsLoadingIntent(true);
      setIntentError(null);
      setIsNotConfigured(false);

      try {
        const res = await fetch("/api/stripe/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((item) => ({
              product_id: item.id,
              quantity_sqft: item.cartQuantitySqft,
            })),
          }),
        });

        const data = await res.json();

        if (cancelled) return;

        if (!res.ok) {
          if (data.notConfigured) {
            setIsNotConfigured(true);
          } else {
            setIntentError(data.error || "Failed to initialize Stripe Payment Intent.");
          }
          return;
        }

        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
      } catch {
        if (!cancelled) {
          setIntentError("Network error while connecting to Stripe payment service.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingIntent(false);
        }
      }
    };

    void fetchPaymentIntent();

    return () => {
      cancelled = true;
    };
  }, [isOpen, cartKey, stripePromise, items]);

  if (!isOpen) return null;

  const appearance: Appearance = {
    theme: "stripe",
    variables: {
      colorPrimary: "#b8860b",
      colorBackground: "#ffffff",
      colorText: "#1c1917",
      colorDanger: "#dc2626",
      fontFamily: "Inter, system-ui, sans-serif",
      borderRadius: "12px",
      spacingUnit: "4px",
    },
    rules: {
      ".Input": {
        backgroundColor: "#ffffff",
        border: "1px solid #e7e5e4",
        boxShadow: "none",
        color: "#1c1917",
      },
      ".Input:focus": {
        border: "1px solid #eab308",
        boxShadow: "0 0 0 1px rgba(184, 134, 11, 0.18)",
      },
      ".Tab": {
        backgroundColor: "#faf8f5",
        border: "1px solid #e7e5e4",
        color: "#57534e",
      },
      ".Tab--selected": {
        backgroundColor: "#ffffff",
        borderColor: "#eab308",
        color: "#1c1917",
      },
    },
  };

  const options: StripeElementsOptions = {
    clientSecret: clientSecret || undefined,
    appearance,
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden text-zinc-900 flex flex-col max-h-[92vh]">
        <div className="bg-[#faf8f5] border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-yellow-500 text-zinc-950">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[11px] font-bold tracking-widest uppercase text-zinc-900">
                Secure checkout
              </p>
              <p className="text-[10px] text-gray-500">Stripe Test Mode · no live charges</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-zinc-900 p-1 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Close payment"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 [scrollbar-width:thin]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-zinc-900 tracking-tight">
                Complete payment
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Card details are collected by Stripe Elements
              </p>
            </div>
            <div className="sm:text-right bg-[#faf8f5] sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-none border-gray-100">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 block">Total due</span>
              <span className="text-xl sm:text-2xl font-mono font-bold text-zinc-900">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          {isNotConfigured ? (
            <div className="space-y-5">
              <div className="p-5 bg-[#faf8f5] border border-yellow-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
                  <KeyRound className="w-4 h-4 text-yellow-600" />
                  <span>Configure Stripe test keys</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Add test API keys to <code className="text-yellow-800 bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-200">.env.local</code> and the same names in Vercel if you deploy.
                </p>
                <div className="p-3 bg-white rounded-xl border border-gray-200 font-mono text-[11px] text-zinc-700 space-y-1 overflow-x-auto">
                  <p>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...</p>
                  <p>STRIPE_SECRET_KEY=sk_test_...</p>
                </div>
                <p className="text-[11px] text-gray-500">
                  Copy keys from the{" "}
                  <a
                    href="https://dashboard.stripe.com/test/apikeys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-yellow-700 hover:text-yellow-800 underline inline-flex items-center gap-1"
                  >
                    Stripe Dashboard <ExternalLink className="w-3 h-3 inline" />
                  </a>.
                </p>
              </div>

              {onFallbackToSandbox && (
                <div className="text-center pt-1">
                  <p className="text-xs text-gray-500 mb-3">
                    Test checkout without API keys using the studio simulator.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onFallbackToSandbox();
                    }}
                    className="w-full bg-white hover:bg-[#faf8f5] text-zinc-900 font-semibold uppercase tracking-widest py-3.5 rounded-xl border border-gray-200 transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-600" />
                    <span>Use sandbox simulator</span>
                  </button>
                </div>
              )}
            </div>
          ) : isLoadingIntent ? (
            <div className="py-14 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
              <p className="text-xs uppercase font-bold tracking-widest text-gray-500">
                Preparing secure checkout...
              </p>
            </div>
          ) : intentError ? (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-xs text-red-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Could not start Stripe checkout</p>
                  <p className="mt-1">{intentError}</p>
                </div>
              </div>
              {onFallbackToSandbox && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onFallbackToSandbox();
                  }}
                  className="w-full bg-white hover:bg-[#faf8f5] text-zinc-900 font-semibold text-xs uppercase tracking-widest py-3.5 rounded-xl border border-gray-200"
                >
                  Use sandbox simulator instead
                </button>
              )}
            </div>
          ) : clientSecret && stripePromise ? (
            <Elements stripe={stripePromise} options={options}>
              <StripePaymentFormInner
                totalAmount={totalAmount}
                paymentIntentId={paymentIntentId || "pi_unknown"}
                fulfillmentMethod={fulfillmentMethod}
                addressId={addressId}
                onPaymentSuccess={onPaymentSuccess}
                onCancel={onClose}
              />
            </Elements>
          ) : null}
        </div>
      </div>
    </div>
  );
}
