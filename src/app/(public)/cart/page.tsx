"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, ShoppingBag, ArrowRight, Lock, Minus, Plus, Truck, Store, Check, Loader2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

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
  const [deliveryMethod, setDeliveryMethod] = useState<"cod" | "pickup">("pickup");

  const handleCheckout = async () => {
    setCheckoutError(null);

    if (!user) {
      router.push("/login");
      return;
    }

    if (items.length === 0) return;

    setIsCheckingOut(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryMethod: deliveryMethod === "cod" ? "Cash on Delivery" : "Pickup from Store",
          items: items.map((item) => ({
            product_id: item.id,
            quantity_sqft: item.cartQuantitySqft,
          })),
        }),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setCheckoutError(
          data.error || "Checkout failed. Please try again."
        );
        return;
      }

      // Success — clear cart and redirect to profile orders
      clearCart();
      router.push("/profile?tab=orders");
    } catch {
      setCheckoutError("Network error. Please check your connection and try again.");
    } finally {
      setIsCheckingOut(false);
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
            Shopping Cart
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
                      
                      {/* Sleek Rounded Pill Quantity Selector */}
                      <div className="border border-gray-200 rounded-full flex items-center overflow-hidden bg-gray-50/80 shadow-sm focus-within:border-yellow-500 focus-within:ring-1 focus-within:ring-yellow-500/30 transition-all">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, Math.max(1, item.cartQuantitySqft - 1))
                          }
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
                              updateQuantity(item.id, val);
                            }
                          }}
                          className="font-mono text-center w-12 bg-transparent border-none outline-none text-sm font-bold text-zinc-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.cartQuantitySqft + 1)
                          }
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

                    {/* Delete Icon with Red Hover Effect */}
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

          {/* ── Order Summary Glassmorphism Sidebar ────────────────── */}
          <div className="lg:w-96 motion-fade-up motion-delay-2">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/40 sticky top-28">
              
              <div className="pb-6 mb-6 border-b border-gray-100">
                <h2 className="text-xl font-display font-bold text-zinc-900 tracking-tight">
                  Order Summary
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Calculated total and delivery preferences.</p>
              </div>

              {/* ── Delivery Method Selectors ─────────────────── */}
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
                  Delivery Method
                </p>
                <div className="space-y-3">
                  
                  {/* Pickup Option */}
                  <label
                    className={`flex items-center gap-4 p-4 cursor-pointer transition-all ${
                      deliveryMethod === "pickup"
                        ? "border-2 border-yellow-500 bg-yellow-50/30 shadow-sm rounded-xl"
                        : "border border-gray-200 bg-gray-50/50 hover:bg-gray-100 rounded-xl"
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="pickup"
                      checked={deliveryMethod === "pickup"}
                      onChange={() => setDeliveryMethod("pickup")}
                      className="sr-only"
                    />
                    <div className={`p-2 rounded-lg ${deliveryMethod === "pickup" ? "bg-yellow-500 text-zinc-950" : "bg-gray-200/60 text-gray-500"}`}>
                      <Store className="w-5 h-5 flex-shrink-0" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-bold block ${
                          deliveryMethod === "pickup" ? "text-zinc-900" : "text-gray-700"
                        }`}>
                          Pickup from Store
                        </span>
                        {deliveryMethod === "pickup" && (
                          <div className="w-4 h-4 bg-yellow-500 text-zinc-950 rounded-full flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 block mt-0.5">
                        Collect from showroom
                      </span>
                    </div>
                  </label>

                  {/* Cash on Delivery Option */}
                  <label
                    className={`flex items-center gap-4 p-4 cursor-pointer transition-all ${
                      deliveryMethod === "cod"
                        ? "border-2 border-yellow-500 bg-yellow-50/30 shadow-sm rounded-xl"
                        : "border border-gray-200 bg-gray-50/50 hover:bg-gray-100 rounded-xl"
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="cod"
                      checked={deliveryMethod === "cod"}
                      onChange={() => setDeliveryMethod("cod")}
                      className="sr-only"
                    />
                    <div className={`p-2 rounded-lg ${deliveryMethod === "cod" ? "bg-yellow-500 text-zinc-950" : "bg-gray-200/60 text-gray-500"}`}>
                      <Truck className="w-5 h-5 flex-shrink-0" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-bold block ${
                          deliveryMethod === "cod" ? "text-zinc-900" : "text-gray-700"
                        }`}>
                          Cash on Delivery
                        </span>
                        {deliveryMethod === "cod" && (
                          <div className="w-4 h-4 bg-yellow-500 text-zinc-950 rounded-full flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 block mt-0.5">
                        Pay upon tile delivery
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 py-4 border-t border-b border-gray-100 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">
                    Subtotal ({items.length} {items.length === 1 ? "item" : "items"})
                  </span>
                  <span className="font-mono text-zinc-900 font-bold">{formatCurrency(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Shipping</span>
                  <span className="font-mono text-emerald-600 font-bold text-xs uppercase">
                    {deliveryMethod === "pickup" ? "Free (Store Pickup)" : "Free (Island-wide)"}
                  </span>
                </div>
              </div>

              {/* Total Calculation Row */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-2 mb-6">
                <div>
                  <span className="font-display font-bold text-zinc-900 text-lg block">Total Amount</span>
                  <span className="text-[10px] text-gray-400 font-medium">Taxes included where applicable</span>
                </div>
                <span className="font-mono font-bold text-xl sm:text-2xl text-zinc-900 break-all">
                  {formatCurrency(cartTotal)}
                </span>
              </div>

              {/* Error Notification */}
              {checkoutError && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 motion-fade-up">
                  <p className="text-xs font-semibold text-red-700">{checkoutError}</p>
                </div>
              )}

              {/* Massive Primary PROCEED TO CHECKOUT Button */}
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="bg-zinc-900 text-white hover:bg-yellow-500 hover:text-black font-semibold rounded-xl py-4 w-full shadow-lg transition-all duration-300 text-center uppercase tracking-wider disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-yellow-400 group-hover:text-black transition-colors" />
                    <span>Proceed to Checkout</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-gray-400 text-center mt-4">
                {deliveryMethod === "cod"
                  ? "Pay in cash when your order arrives (Free Delivery)"
                  : "Your order will be ready for store pickup"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
