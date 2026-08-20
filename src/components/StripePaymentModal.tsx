"use client";

import { useState, useEffect, useTransition, FormEvent } from "react";
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
import type { PaymentDetailsSnapshot } from "@/lib/sandboxPayment";

interface StripePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Array<{ id: string; cartQuantitySqft: number }>;
  totalAmount: number;
  onPaymentSuccess: (paymentDetails: PaymentDetailsSnapshot) => Promise<void> | void;
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

// ── Embedded Stripe Form Inner Component ─────────────────

function StripePaymentFormInner({
  totalAmount,
  paymentIntentId,
  onPaymentSuccess,
  onCancel,
}: {
  totalAmount: number;
  paymentIntentId: string;
  onPaymentSuccess: (details: PaymentDetailsSnapshot) => Promise<void> | void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successDetails, setSuccessDetails] = useState<PaymentDetailsSnapshot | null>(null);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  const [, startTransition] = useTransition();

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
        redirect: "if_required",
      });

      if (result.error) {
        setErrorMessage(result.error.message || "Stripe test card authorization failed.");
        setIsProcessing(false);
        return;
      }

      if (result.paymentIntent && (result.paymentIntent.status === "succeeded" || result.paymentIntent.status === "processing")) {
        const details: PaymentDetailsSnapshot = {
          transaction_id: result.paymentIntent.id,
          auth_code: `STRIPE-${result.paymentIntent.id.slice(-6).toUpperCase()}`,
          payment_channel: "card",
          currency: "LKR",
          amount: totalAmount,
          paid_at: new Date().toISOString(),
          environment: "sandbox",
        };

        setSuccessDetails(details);
        setIsSuccess(true);
        setIsProcessing(false);

        startTransition(async () => {
          try {
            await onPaymentSuccess(details);
          } catch (err: unknown) {
            console.error("Failed to complete order callback after Stripe payment:", err);
            setErrorMessage("Payment succeeded in Stripe, but order creation failed. Please contact support.");
          }
        });
      } else {
        setErrorMessage("Payment did not complete. Please try again.");
        setIsProcessing(false);
      }
    } catch (err: unknown) {
      console.error("Unexpected Stripe confirm error:", err);
      setErrorMessage("An unexpected error occurred during Stripe confirmation.");
      setIsProcessing(false);
    }
  };

  if (isSuccess && successDetails) {
    return (
      <div className="py-6 sm:py-8 text-center space-y-6 animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 mx-auto bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-500/40 shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Stripe Test Payment Succeeded
          </span>
          <h3 className="text-2xl font-display font-bold text-white mt-3">
            Payment Confirmed
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
            Your payment intent was verified by Stripe Test Mode and your order has been saved.
          </p>
        </div>

        <div className="max-w-md mx-auto bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 sm:p-5 text-left space-y-3 font-mono text-xs">
          <div className="flex justify-between pb-2 border-b border-zinc-800 text-zinc-400">
            <span>PaymentIntent ID:</span>
            <span className="text-yellow-400 font-bold break-all">{successDetails.transaction_id}</span>
          </div>
          <div className="flex justify-between pb-2 border-b border-zinc-800 text-zinc-400">
            <span>Provider:</span>
            <span className="text-white">Stripe Test Mode (PCI-DSS)</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Amount Paid:</span>
            <span className="text-emerald-400 font-bold">{formatCurrency(successDetails.amount)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="w-full max-w-md bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold uppercase tracking-wider py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <span>View Order in Account Portal</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Official Stripe Test Card Autofill / Copy Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-yellow-400" />
            Official Stripe Test Cards
          </span>
          <span className="text-[10px] text-zinc-500">Click to copy number</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {STRIPE_TEST_CARDS.map((card) => (
            <button
              key={card.number}
              type="button"
              onClick={() => handleCopyCard(card.number)}
              className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-800/60 hover:border-zinc-700 text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
                  {card.badge}
                </span>
                {copiedNumber === card.number ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300" />
                )}
              </div>
              <p className="text-xs font-mono font-bold text-zinc-200">{card.number}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{card.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Embedded Stripe Elements Component */}
      <div className="p-4 bg-zinc-950/70 border border-zinc-800/90 rounded-2xl shadow-inner">
        <PaymentElement 
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-red-400">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
          <p className="font-semibold">{errorMessage}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold uppercase tracking-wider py-4 rounded-xl shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin text-zinc-950" />
            <span className="text-xs font-semibold">Authorizing with Stripe Test Network...</span>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 text-zinc-950" />
            <span>Pay {formatCurrency(totalAmount)} with Stripe</span>
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-4 text-[10px] text-zinc-500 pt-1">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          Stripe PCI Level 1 Certified
        </span>
        <span className="font-mono text-zinc-600">ID: {paymentIntentId.slice(0, 16)}...</span>
      </div>
    </form>
  );
}

// ── Main Modal Container ─────────────────────────────────

export function StripePaymentModal({
  isOpen,
  onClose,
  items,
  totalAmount,
  onPaymentSuccess,
  onFallbackToSandbox,
}: StripePaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isLoadingIntent, setIsLoadingIntent] = useState(false);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [isNotConfigured, setIsNotConfigured] = useState(false);

  const stripePromise = getStripeClient();

  useEffect(() => {
    if (!isOpen || items.length === 0) {
      setClientSecret(null);
      setPaymentIntentId(null);
      setIntentError(null);
      setIsNotConfigured(false);
      return;
    }

    // If client publishable key is missing
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
            items: items.map((i) => ({
              product_id: i.id,
              quantity_sqft: i.cartQuantitySqft,
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
  }, [isOpen, items, stripePromise]);

  if (!isOpen) return null;

  // Custom luxury theme options for Stripe Elements
  const appearance: Appearance = {
    theme: "night",
    variables: {
      colorPrimary: "#eab308", // Yellow 500
      colorBackground: "#09090b", // Zinc 950
      colorText: "#f4f4f5", // Zinc 100
      colorDanger: "#ef4444",
      fontFamily: "Inter, system-ui, sans-serif",
      borderRadius: "12px",
      spacingUnit: "4.5px",
    },
    rules: {
      ".Input": {
        backgroundColor: "#09090b",
        border: "1px solid #27272a",
        boxShadow: "none",
        color: "#ffffff",
      },
      ".Input:focus": {
        border: "1px solid #eab308",
        boxShadow: "0 0 0 1px rgba(234, 179, 8, 0.3)",
      },
      ".Tab": {
        backgroundColor: "#18181b",
        border: "1px solid #27272a",
        color: "#a1a1aa",
      },
      ".Tab--selected": {
        backgroundColor: "#27272a",
        borderColor: "#eab308",
        color: "#ffffff",
      },
    },
  };

  const options: StripeElementsOptions = {
    clientSecret: clientSecret || undefined,
    appearance,
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-700/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[92vh]">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-purple-900/30 via-indigo-900/30 to-purple-900/30 border-b border-purple-500/30 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
            </span>
            <span className="text-[11px] font-bold tracking-widest uppercase text-purple-300">
              Stripe Test Mode
            </span>
            <span className="hidden sm:inline-block text-[10px] text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700">
              Live Elements API
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 [scrollbar-width:thin]">
          
          {/* Header Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
            <div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2">
                <span>Stripe Checkout</span>
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30 uppercase font-sans">
                  Test Mode
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Official Stripe Elements Payment Terminal
              </p>
            </div>
            <div className="sm:text-right bg-zinc-800/60 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-none border-zinc-800">
              <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 block">Total Due</span>
              <span className="text-xl sm:text-2xl font-mono font-bold text-yellow-400">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          {/* If Stripe Keys are Not Yet Configured in .env.local */}
          {isNotConfigured ? (
            <div className="py-6 space-y-5">
              <div className="p-5 bg-gradient-to-br from-amber-500/10 via-zinc-900 to-zinc-950 border border-yellow-500/30 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-yellow-400 font-bold text-sm">
                  <KeyRound className="w-4 h-4" />
                  <span>Configure Stripe Test Keys</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  To process transactions with live Stripe Test Mode, add your test API keys to <code className="text-yellow-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">.env.local</code>:
                </p>
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 font-mono text-[11px] text-zinc-300 space-y-1 overflow-x-auto">
                  <p className="text-emerald-400"># In your .env.local file:</p>
                  <p>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...</p>
                  <p>STRIPE_SECRET_KEY=sk_test_...</p>
                </div>
                <p className="text-[11px] text-zinc-400">
                  You can copy these keys from your{" "}
                  <a
                    href="https://dashboard.stripe.com/test/apikeys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-yellow-400 hover:underline inline-flex items-center gap-1"
                  >
                    Stripe Developer Dashboard <ExternalLink className="w-3 h-3 inline" />
                  </a>.
                </p>
              </div>

              {onFallbackToSandbox && (
                <div className="text-center pt-2">
                  <p className="text-xs text-zinc-400 mb-3">
                    Want to test the checkout flow right now without adding API keys?
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onFallbackToSandbox();
                    }}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-yellow-400 font-bold uppercase tracking-wider py-3.5 rounded-xl border border-yellow-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <span>Switch to Built-in Sandbox Terminal</span>
                  </button>
                </div>
              )}
            </div>
          ) : isLoadingIntent ? (
            /* Loading State while creating Stripe PaymentIntent */
            <div className="py-14 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
              <p className="text-xs uppercase font-bold tracking-widest text-zinc-400">
                Initializing Stripe Test Terminal...
              </p>
            </div>
          ) : intentError ? (
            /* Error creating PaymentIntent */
            <div className="py-6 space-y-4">
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3 text-xs text-red-400">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                <div>
                  <p className="font-bold">Stripe Initialization Error</p>
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
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-yellow-400 font-bold text-xs py-3.5 rounded-xl border border-yellow-500/30"
                >
                  Use Built-in Sandbox Simulator Instead
                </button>
              )}
            </div>
          ) : clientSecret && stripePromise ? (
            /* Render Official Stripe Elements */
            <Elements stripe={stripePromise} options={options}>
              <StripePaymentFormInner
                totalAmount={totalAmount}
                paymentIntentId={paymentIntentId || "pi_test"}
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
