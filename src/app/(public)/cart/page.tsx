"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Trash2, 
  ShoppingBag, 
  ArrowRight, 
  Lock, 
  Minus, 
  Plus, 
  Truck, 
  Store, 
  Check, 
  Loader2, 
  MapPin, 
  CreditCard, 
  Sparkles,
  Banknote,
  ShieldCheck
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { listAddresses } from "@/app/actions/addresses";
import { AddAddressModal } from "@/components/AddAddressModal";
import { SandboxPaymentModal } from "@/components/SandboxPaymentModal";
import { StripePaymentModal } from "@/components/StripePaymentModal";
import type { SavedAddress } from "@/lib/address";
import type { PaymentDetailsSnapshot } from "@/lib/sandboxPayment";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function CartPage() {
  const router = useRouter();
  const { items, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  
  // Fulfillment & Payment Methods
  const [fulfillmentMethod, setFulfillmentMethod] = useState<"pickup" | "delivery">("pickup");
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "sandbox" | "cod" | "showroom">("stripe");
  
  // Addresses
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Modals
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [showSandboxModal, setShowSandboxModal] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setAddresses([]);
      setSelectedAddressId(null);
      return;
    }

    let cancelled = false;

    const loadAddresses = async () => {
      const result = await listAddresses();
      if (cancelled) return;

      if (!result.success) {
        setCheckoutError(result.error || "Could not load delivery addresses.");
        return;
      }

      setAddresses(result.addresses);
      setSelectedAddressId((current) => {
        if (current && result.addresses.some((row) => row.id === current)) return current;
        return result.addresses[0]?.id ?? null;
      });
    };

    void loadAddresses();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Adjust default payment option when fulfillment method changes
  const handleFulfillmentChange = (method: "pickup" | "delivery") => {
    setFulfillmentMethod(method);
    setCheckoutError(null);
    if (method === "pickup" && paymentMethod === "cod") {
      setPaymentMethod("stripe");
    } else if (method === "delivery" && paymentMethod === "showroom") {
      setPaymentMethod("stripe");
    }
  };

  const handleCheckoutInitiation = async () => {
    setCheckoutError(null);

    if (!user) {
      router.push("/login?next=/cart");
      return;
    }

    if (items.length === 0) return;

    if (fulfillmentMethod === "delivery" && !selectedAddressId) {
      setCheckoutError("Please select or add a delivery address.");
      setShowAddressForm(true);
      return;
    }

    // Launch Stripe Elements Modal
    if (paymentMethod === "stripe") {
      setShowStripeModal(true);
      return;
    }

    // Launch Built-in Sandbox Modal
    if (paymentMethod === "sandbox") {
      setShowSandboxModal(true);
      return;
    }

    // For Cash on Delivery or Pay at Showroom
    setIsCheckingOut(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryMethod: fulfillmentMethod === "delivery" ? "Cash on Delivery" : "Pickup from Store",
          addressId: fulfillmentMethod === "delivery" ? selectedAddressId : null,
          paymentMethod: paymentMethod === "cod" ? "Cash on Delivery" : "Pickup from Store",
          paymentStatus: "Pending",
          items: items.map((item) => ({
            product_id: item.id,
            quantity_sqft: item.cartQuantitySqft,
          })),
        }),
      });

      if (res.status === 401) {
        router.push("/login?next=/cart");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setCheckoutError(data.error || "Checkout failed. Please try again.");
        return;
      }

      clearCart();
      router.push("/profile?tab=orders");
    } catch {
      setCheckoutError("Network error. Please check your connection and try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handlePaymentSuccess = async (paymentDetails: PaymentDetailsSnapshot, methodLabel: string) => {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryMethod: fulfillmentMethod === "delivery" ? "Island-wide Delivery" : "Pickup from Store",
          addressId: fulfillmentMethod === "delivery" ? selectedAddressId : null,
          paymentMethod: methodLabel,
          paymentStatus: "Paid",
          paymentDetails,
          items: items.map((item) => ({
            product_id: item.id,
            quantity_sqft: item.cartQuantitySqft,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Order creation failed.");
      }

      clearCart();
      setShowStripeModal(false);
      setShowSandboxModal(false);
      router.push("/profile?tab=orders");
    } catch (err: unknown) {
      console.error("Payment order saving error:", err);
      const msg = err instanceof Error ? err.message : "Failed to record order.";
      setCheckoutError(msg);
      throw err;
    }
  };

  // ── Empty Cart State ────────────────────────────────

  if (items.length === 0) {
    return (
      <section className="min-h-[calc(100svh-6rem)] bg-gradient-to-b from-gray-50/60 via-gray-50 to-gray-100/40 pt-28 pb-16 px-4 sm:px-6 flex items-center justify-center">
        <div className="text-center motion-fade-up max-w-md w-full bg-white/90 backdrop-blur-md p-6 sm:p-10 rounded-2xl shadow-xl border border-gray-100">
          <div className="w-20 h-20 mx-auto mb-6 bg-yellow-500/10 text-yellow-600 rounded-full flex items-center justify-center border border-yellow-500/20 shadow-sm">
            <ShoppingBag className="w-9 h-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-zinc-900 mb-3">
            Your Cart is Empty
          </h1>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            Browse our curated luxury tile collections and select the ideal materials for your architectural project.
          </p>
          <Link
            href="/collections"
            className="inline-flex items-center justify-center gap-3 bg-zinc-900 text-white hover:bg-yellow-500 hover:text-black font-semibold rounded-xl py-4 px-8 text-xs uppercase tracking-widest transition-all duration-300 shadow-md hover:shadow-xl w-full sm:w-auto"
          >
            <span>Explore Collections</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    );
  }

  // ── Cart with Items ─────────────────────────────────

  return (
    <section className="min-h-[calc(100svh-6rem)] bg-gradient-to-b from-gray-50/60 via-gray-50 to-gray-100/40 pt-24 sm:pt-28 pb-24 sm:pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 motion-fade-up">
          <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-600 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
            Shopping Cart & Checkout
          </span>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-zinc-900 mt-2">
            Your Selection ({items.length} {items.length === 1 ? "Item" : "Items"})
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* ── Cart Items List ───────────────────────────── */}
          <div className="flex-1 motion-fade-up motion-delay-1">
            
            {/* Desktop Column Headers */}
            <div className="hidden md:grid grid-cols-[2.5fr_1fr_1fr_1fr_auto] gap-6 pb-4 px-4 border-b border-gray-200/80 mb-4">
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Product Specification</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400 text-center">Unit Price</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400 text-center">Quantity (sq ft)</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400 text-right">Subtotal</span>
              <span className="w-10" />
            </div>

            {/* Product Item Cards */}
            <div className="space-y-4">
              {items.map((item) => {
                const lineTotal = item.price_per_sqft * item.cartQuantitySqft;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:bg-gray-50/50 transition-all md:grid md:grid-cols-[2.5fr_1fr_1fr_1fr_auto] md:gap-6 md:items-center group"
                  >
                    {/* Product Info */}
                    <div className="flex items-center gap-3 sm:gap-5 mb-4 md:mb-0 min-w-0">
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden border border-gray-200/60 shadow-inner">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-600 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 mb-1 inline-block">
                          {item.category}
                        </span>
                        <h3 className="font-display font-bold text-zinc-900 text-base truncate">{item.name}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Architectural Tile Specification</p>
                      </div>
                    </div>

                    {/* Price per sq ft */}
                    <div className="flex justify-between md:justify-center items-center mb-3 md:mb-0">
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-400 md:hidden">Unit Price:</span>
                      <span className="font-mono text-sm font-semibold text-zinc-900">
                        {formatCurrency(item.price_per_sqft)}
                      </span>
                    </div>

                    {/* Quantity Control Pill */}
                    <div className="flex justify-between md:justify-center items-center mb-3 md:mb-0">
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-400 md:hidden">Qty (sq ft):</span>
                      
                      <div className="border border-gray-200 rounded-full flex items-center overflow-hidden bg-gray-50/80 shadow-sm focus-within:border-yellow-500 focus-within:ring-1 focus-within:ring-yellow-500/30 transition-all">
                        <button
                          onClick={() => {
                            updateQuantity(item.id, Math.max(1, item.cartQuantitySqft - 1));
                          }}
                          className="px-3 py-1.5 hover:bg-gray-200/80 text-gray-600 transition-colors flex items-center justify-center active:scale-95"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        
                        <input
                          type="number"
                          min={1}
                          value={item.cartQuantitySqft}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val > 0) {
                              const max = item.stockSqft ?? Infinity;
                              if (val > max) {
                                alert(`Only ${max} sqft available in stock.`);
                                updateQuantity(item.id, max);
                              } else {
                                updateQuantity(item.id, val);
                              }
                            }
                          }}
                          className="font-mono text-center w-12 bg-transparent border-none outline-none text-sm font-bold text-zinc-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        
                        <button
                          onClick={() => {
                            const max = item.stockSqft ?? Infinity;
                            if (item.cartQuantitySqft + 1 > max) {
                              alert(`Only ${max} sqft available in stock.`);
                            } else {
                              updateQuantity(item.id, item.cartQuantitySqft + 1);
                            }
                          }}
                          className="px-3 py-1.5 hover:bg-gray-200/80 text-gray-600 transition-colors flex items-center justify-center active:scale-95"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Line Subtotal */}
                    <div className="flex justify-between md:justify-end items-center mb-3 md:mb-0">
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-400 md:hidden">Subtotal:</span>
                      <span className="font-mono text-base font-bold text-zinc-900">
                        {formatCurrency(lineTotal)}
                      </span>
                    </div>

                    {/* Delete Icon */}
                    <div className="flex justify-end items-center">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-full transition-all"
                        aria-label={`Remove ${item.name}`}
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cart Footer Actions */}
            <div className="mt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/60 p-4 rounded-xl border border-gray-100">
              <Link
                href="/collections"
                className="text-xs font-bold uppercase tracking-widest text-gray-600 hover:text-zinc-900 transition-colors flex items-center gap-2"
              >
                <span>← Continue Shopping</span>
              </Link>
              <button
                onClick={clearCart}
                className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-red-600 transition-colors"
              >
                Clear Cart
              </button>
            </div>
          </div>

          {/* ── Order Summary & Checkout Sidebar ────────────────── */}
          <div className="lg:w-[420px] motion-fade-up motion-delay-2">
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-7 shadow-xl border border-gray-100 sticky top-28 space-y-6">
              
              <div className="pb-4 border-b border-gray-100">
                <h2 className="text-xl font-display font-bold text-zinc-900 tracking-tight">
                  Checkout Summary
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Select fulfillment and payment preferences.</p>
              </div>

              {/* ── Step 1: Fulfillment Method ─────────────────── */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2.5">
                  1. Fulfillment Option
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  
                  {/* Pickup Option */}
                  <button
                    type="button"
                    onClick={() => handleFulfillmentChange("pickup")}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      fulfillmentMethod === "pickup"
                        ? "border-2 border-yellow-500 bg-yellow-50/40 shadow-sm"
                        : "border-gray-200 bg-gray-50/60 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 rounded-xl ${fulfillmentMethod === "pickup" ? "bg-yellow-500 text-zinc-950" : "bg-gray-200 text-gray-600"}`}>
                        <Store className="w-4 h-4" />
                      </div>
                      {fulfillmentMethod === "pickup" && (
                        <div className="w-4 h-4 bg-yellow-500 text-zinc-950 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-zinc-900 block">Showroom Pickup</span>
                      <span className="text-[10px] text-gray-500 block mt-0.5">Collect from Gallery</span>
                    </div>
                  </button>

                  {/* Delivery Option */}
                  <button
                    type="button"
                    onClick={() => handleFulfillmentChange("delivery")}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      fulfillmentMethod === "delivery"
                        ? "border-2 border-yellow-500 bg-yellow-50/40 shadow-sm"
                        : "border-gray-200 bg-gray-50/60 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 rounded-xl ${fulfillmentMethod === "delivery" ? "bg-yellow-500 text-zinc-950" : "bg-gray-200 text-gray-600"}`}>
                        <Truck className="w-4 h-4" />
                      </div>
                      {fulfillmentMethod === "delivery" && (
                        <div className="w-4 h-4 bg-yellow-500 text-zinc-950 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-zinc-900 block">Island Delivery</span>
                      <span className="text-[10px] text-gray-500 block mt-0.5">Direct to Site</span>
                    </div>
                  </button>
                </div>

                {/* Delivery Address Selector (If Delivery selected) */}
                {fulfillmentMethod === "delivery" && (
                  <div className="mt-3.5 space-y-2.5 bg-gray-50/80 p-3.5 rounded-2xl border border-gray-200/80 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">
                        Delivery Address
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(true)}
                        className="text-[10px] font-bold uppercase text-yellow-700 hover:text-yellow-800"
                      >
                        + New
                      </button>
                    </div>

                    {addresses.length === 0 ? (
                      <div className="text-center py-3">
                        <p className="text-xs text-gray-500 mb-2">No delivery address saved yet.</p>
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(true)}
                          className="text-xs font-bold uppercase tracking-wider text-zinc-900 bg-yellow-400 hover:bg-yellow-500 px-4 py-2 rounded-xl shadow-sm transition-all"
                        >
                          + Add Delivery Address
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1 [scrollbar-width:thin]">
                        {addresses.map((addr) => (
                          <label
                            key={addr.id}
                            className={`flex items-start gap-2.5 p-2.5 cursor-pointer transition-all rounded-xl ${
                              selectedAddressId === addr.id
                                ? "border-2 border-yellow-500 bg-yellow-50/50"
                                : "border border-gray-200 bg-white hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="radio"
                              name="deliveryAddress"
                              value={addr.id}
                              checked={selectedAddressId === addr.id}
                              onChange={() => setSelectedAddressId(addr.id)}
                              className="sr-only"
                            />
                            <MapPin className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                              selectedAddressId === addr.id ? "text-yellow-600" : "text-gray-400"
                            }`} />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-zinc-900">{addr.label || "Address"}</p>
                              <p className="text-[11px] text-gray-600 truncate">{addr.line1}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Step 2: Payment Method ─────────────────────── */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2.5">
                  2. Payment Method
                </p>
                <div className="space-y-2">
                  
                  {/* Stripe Test Mode Option */}
                  <label
                    className={`flex items-center gap-3.5 p-3.5 cursor-pointer transition-all rounded-2xl ${
                      paymentMethod === "stripe"
                        ? "border-2 border-yellow-500 bg-yellow-50/40 shadow-sm"
                        : "border border-gray-200 bg-gray-50/60 hover:bg-gray-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="stripe"
                      checked={paymentMethod === "stripe"}
                      onChange={() => setPaymentMethod("stripe")}
                      className="sr-only"
                    />
                    <div className={`p-2 rounded-xl ${paymentMethod === "stripe" ? "bg-yellow-500 text-zinc-950" : "bg-purple-100 text-purple-700"}`}>
                      <CreditCard className="w-4 h-4 flex-shrink-0" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                          Stripe Elements (Test Mode)
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded border border-purple-200">
                            Live API
                          </span>
                        </span>
                        {paymentMethod === "stripe" && (
                          <div className="w-4 h-4 bg-yellow-500 text-zinc-950 rounded-full flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-500 block mt-0.5">
                        Official Stripe Cards, Apple Pay, Google Pay & Link
                      </span>
                    </div>
                  </label>

                  {/* Built-in Sandbox Terminal */}
                  <label
                    className={`flex items-center gap-3.5 p-3.5 cursor-pointer transition-all rounded-2xl ${
                      paymentMethod === "sandbox"
                        ? "border-2 border-yellow-500 bg-yellow-50/40 shadow-sm"
                        : "border border-gray-200 bg-gray-50/60 hover:bg-gray-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="sandbox"
                      checked={paymentMethod === "sandbox"}
                      onChange={() => setPaymentMethod("sandbox")}
                      className="sr-only"
                    />
                    <div className={`p-2 rounded-xl ${paymentMethod === "sandbox" ? "bg-yellow-500 text-zinc-950" : "bg-gray-200 text-gray-600"}`}>
                      <Sparkles className="w-4 h-4 flex-shrink-0" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                          Local Sandbox Simulator
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-yellow-500/20 text-yellow-800 px-1.5 py-0.2 rounded border border-yellow-500/30">
                            Offline
                          </span>
                        </span>
                        {paymentMethod === "sandbox" && (
                          <div className="w-4 h-4 bg-yellow-500 text-zinc-950 rounded-full flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-500 block mt-0.5">
                        Built-in Virtual Card & 3DS challenge terminal
                      </span>
                    </div>
                  </label>

                  {/* Cash on Delivery (Delivery only) */}
                  {fulfillmentMethod === "delivery" && (
                    <label
                      className={`flex items-center gap-3.5 p-3.5 cursor-pointer transition-all rounded-2xl ${
                        paymentMethod === "cod"
                          ? "border-2 border-yellow-500 bg-yellow-50/40 shadow-sm"
                          : "border border-gray-200 bg-gray-50/60 hover:bg-gray-100"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={paymentMethod === "cod"}
                        onChange={() => setPaymentMethod("cod")}
                        className="sr-only"
                      />
                      <div className={`p-2 rounded-xl ${paymentMethod === "cod" ? "bg-yellow-500 text-zinc-950" : "bg-gray-200 text-gray-600"}`}>
                        <Banknote className="w-4 h-4 flex-shrink-0" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-900">
                            Cash on Delivery (COD)
                          </span>
                          {paymentMethod === "cod" && (
                            <div className="w-4 h-4 bg-yellow-500 text-zinc-950 rounded-full flex items-center justify-center flex-shrink-0">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-500 block mt-0.5">
                          Pay cash upon material unloading
                        </span>
                      </div>
                    </label>
                  )}

                  {/* Pay at Showroom (Pickup only) */}
                  {fulfillmentMethod === "pickup" && (
                    <label
                      className={`flex items-center gap-3.5 p-3.5 cursor-pointer transition-all rounded-2xl ${
                        paymentMethod === "showroom"
                          ? "border-2 border-yellow-500 bg-yellow-50/40 shadow-sm"
                          : "border border-gray-200 bg-gray-50/60 hover:bg-gray-100"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="showroom"
                        checked={paymentMethod === "showroom"}
                        onChange={() => setPaymentMethod("showroom")}
                        className="sr-only"
                      />
                      <div className={`p-2 rounded-xl ${paymentMethod === "showroom" ? "bg-yellow-500 text-zinc-950" : "bg-gray-200 text-gray-600"}`}>
                        <Store className="w-4 h-4 flex-shrink-0" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-900">
                            Pay at Showroom
                          </span>
                          {paymentMethod === "showroom" && (
                            <div className="w-4 h-4 bg-yellow-500 text-zinc-950 rounded-full flex items-center justify-center flex-shrink-0">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-500 block mt-0.5">
                          Settle payment during in-person tile collection
                        </span>
                      </div>
                    </label>
                  )}

                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2.5 py-4 border-t border-b border-gray-100">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 font-medium">
                    Subtotal ({items.length} {items.length === 1 ? "item" : "items"})
                  </span>
                  <span className="font-mono text-zinc-900 font-bold">{formatCurrency(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 font-medium">Shipping / Logistics</span>
                  <span className="font-mono text-emerald-600 font-bold uppercase">
                    {fulfillmentMethod === "pickup" ? "Free (Pickup)" : "Free (Island-wide)"}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-2">
                  <span className="font-display font-bold text-zinc-900 text-base">Total Payable</span>
                  <span className="font-mono font-bold text-xl text-zinc-900">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>
              </div>

              {/* Error Notification */}
              {checkoutError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 motion-fade-up">
                  <p className="text-xs font-semibold text-red-700">{checkoutError}</p>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleCheckoutInitiation}
                disabled={isCheckingOut || (fulfillmentMethod === "delivery" && !selectedAddressId)}
                className="bg-zinc-900 text-white hover:bg-yellow-500 hover:text-black font-semibold rounded-xl py-4 w-full shadow-lg transition-all duration-300 text-center uppercase tracking-wider disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : paymentMethod === "stripe" ? (
                  <>
                    <CreditCard className="w-4 h-4 text-yellow-400 group-hover:text-black transition-colors" />
                    <span>Pay with Stripe (Test Mode)</span>
                  </>
                ) : paymentMethod === "sandbox" ? (
                  <>
                    <Sparkles className="w-4 h-4 text-yellow-400 group-hover:text-black transition-colors" />
                    <span>Pay with Sandbox Simulator</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-yellow-400 group-hover:text-black transition-colors" />
                    <span>Confirm & Place Order</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Stripe Test Mode & SSL Encrypted Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Address Modal */}
      <AddAddressModal
        open={showAddressForm}
        onClose={() => setShowAddressForm(false)}
        onSaved={(address) => {
          setAddresses((current) => [address, ...current.filter((row) => row.id !== address.id)]);
          setSelectedAddressId(address.id);
          setCheckoutError(null);
        }}
      />

      {/* Stripe Payment Elements Modal */}
      <StripePaymentModal
        isOpen={showStripeModal}
        onClose={() => setShowStripeModal(false)}
        items={items}
        totalAmount={cartTotal}
        onPaymentSuccess={(details) => handlePaymentSuccess(details, "Stripe (Test Mode)")}
        onFallbackToSandbox={() => {
          setPaymentMethod("sandbox");
          setShowSandboxModal(true);
        }}
      />

      {/* Built-in Sandbox Modal */}
      <SandboxPaymentModal
        isOpen={showSandboxModal}
        onClose={() => setShowSandboxModal(false)}
        totalAmount={cartTotal}
        onPaymentSuccess={(details) => handlePaymentSuccess(details, "Online Payment (Sandbox)")}
      />
    </section>
  );
}
