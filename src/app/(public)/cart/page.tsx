"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, ShoppingBag, ArrowRight, Lock, Minus, Plus, Truck, Store } from "lucide-react";
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
      <section className="min-h-[calc(100vh-6rem)] bg-surface flex items-center justify-center px-6">
        <div className="text-center motion-fade-up max-w-md">
          <div className="w-20 h-20 mx-auto mb-8 bg-surface-container-high flex items-center justify-center">
            <ShoppingBag className="w-9 h-9 text-on-surface-variant opacity-50" />
          </div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-on-surface mb-4">
            Your Cart is Empty
          </h1>
          <p className="text-on-surface-variant mb-10">
            Browse our curated collections and find the perfect tiles for your next project.
          </p>
          <Link
            href="/collections"
            className="kinetic-button inline-flex items-center gap-3 bg-primary hover:bg-primary-dim text-on-primary px-10 py-4 text-sm font-semibold uppercase tracking-widest transition-colors"
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
    <section className="min-h-[calc(100vh-6rem)] bg-surface py-12 md:py-16 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10 motion-fade-up">
          <p className="text-xs uppercase tracking-[0.2em] text-accent font-semibold mb-3">
            Shopping Cart
          </p>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-on-surface">
            Your Selection
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* ── Cart Items ───────────────────────────── */}
          <div className="flex-1 motion-fade-up motion-delay-1">
            {/* Column Headers (desktop) */}
            <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-6 pb-4 border-b border-outline-variant/20 mb-6">
              <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Product</span>
              <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant text-center">Price / tile</span>
              <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant text-center">Qty</span>
              <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant text-right">Subtotal</span>
              <span className="w-10" />
            </div>

            {/* Items */}
            <div className="space-y-6">
              {items.map((item) => {
                const lineTotal = item.price_per_sqft * item.cartQuantitySqft;

                return (
                  <div
                    key={item.id}
                    className="bg-surface-container-lowest premium-shadow p-5 md:p-6 md:grid md:grid-cols-[2fr_1fr_1fr_1fr_auto] md:gap-6 md:items-center"
                  >
                    {/* Product Info */}
                    <div className="flex items-center gap-5 mb-4 md:mb-0">
                      <div className="relative w-20 h-20 flex-shrink-0 bg-surface-container overflow-hidden">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-widest text-accent mb-1">{item.category}</p>
                        <h3 className="font-display font-semibold text-on-surface">{item.name}</h3>
                      </div>
                    </div>

                    {/* Price per tile */}
                    <div className="flex justify-between md:justify-center mb-3 md:mb-0">
                      <span className="text-xs uppercase tracking-widest text-on-surface-variant md:hidden">Price:</span>
                      <span className="text-sm text-on-surface font-medium">
                        {formatCurrency(item.price_per_sqft)}
                      </span>
                    </div>

                    {/* Quantity Control */}
                    <div className="flex justify-between md:justify-center items-center mb-3 md:mb-0">
                      <span className="text-xs uppercase tracking-widest text-on-surface-variant md:hidden">Qty:</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, Math.max(1, item.cartQuantitySqft - 1))
                          }
                          className="w-8 h-8 flex items-center justify-center bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-colors"
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
                          className="w-16 text-center bg-transparent border-b border-outline py-1.5 text-sm text-on-surface outline-none form-field-animate focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.cartQuantitySqft + 1)
                          }
                          className="w-8 h-8 flex items-center justify-center bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Line Subtotal */}
                    <div className="flex justify-between md:justify-end mb-3 md:mb-0">
                      <span className="text-xs uppercase tracking-widest text-on-surface-variant md:hidden">Subtotal:</span>
                      <span className="text-sm font-bold text-on-surface">
                        {formatCurrency(lineTotal)}
                      </span>
                    </div>

                    {/* Remove */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-[#9f403d] transition-colors"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Continue Shopping */}
            <div className="mt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <Link
                href="/collections"
                className="kinetic-link text-sm font-semibold uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors"
              >
                ← Continue Shopping
              </Link>
              <button
                onClick={clearCart}
                className="text-sm font-semibold uppercase tracking-widest text-on-surface-variant hover:text-[#9f403d] transition-colors"
              >
                Clear Cart
              </button>
            </div>
          </div>

          {/* ── Order Summary Sidebar ────────────────── */}
          <div className="lg:w-96 motion-fade-up motion-delay-2">
            <div className="bg-surface-container-lowest premium-shadow p-8 sticky top-28">
              <h2 className="text-lg font-display font-semibold text-on-surface mb-8">
                Order Summary
              </h2>

              {/* ── Delivery Method ─────────────────── */}
              <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4">
                  Delivery Method
                </p>
                <div className="space-y-3">
                  <label
                    className={`flex items-center gap-4 p-4 cursor-pointer transition-all ${
                      deliveryMethod === "pickup"
                        ? "bg-primary/5 border-l-2 border-primary"
                        : "bg-surface-container-low hover:bg-surface-container border-l-2 border-transparent"
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
                    <Store className={`w-5 h-5 flex-shrink-0 ${
                      deliveryMethod === "pickup" ? "text-primary" : "text-on-surface-variant"
                    }`} />
                    <div>
                      <span className={`text-sm font-semibold block ${
                        deliveryMethod === "pickup" ? "text-on-surface" : "text-on-surface-variant"
                      }`}>
                        Pickup from Store
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        Collect your order from our showroom
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-4 p-4 cursor-pointer transition-all ${
                      deliveryMethod === "cod"
                        ? "bg-primary/5 border-l-2 border-primary"
                        : "bg-surface-container-low hover:bg-surface-container border-l-2 border-transparent"
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
                    <Truck className={`w-5 h-5 flex-shrink-0 ${
                      deliveryMethod === "cod" ? "text-primary" : "text-on-surface-variant"
                    }`} />
                    <div>
                      <span className={`text-sm font-semibold block ${
                        deliveryMethod === "cod" ? "text-on-surface" : "text-on-surface-variant"
                      }`}>
                        Cash on Delivery
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        Pay when your order arrives
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="section-divider mb-6" />

              {/* ── Price Breakdown ─────────────────── */}
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">
                    Subtotal ({items.length} {items.length === 1 ? "item" : "items"})
                  </span>
                  <span className="text-on-surface font-medium">{formatCurrency(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Shipping</span>
                  <span className="text-on-surface font-medium">
                    {deliveryMethod === "pickup" ? "Free (Store Pickup)" : "Free (Island-wide)"}
                  </span>
                </div>
              </div>

              <div className="section-divider mb-6" />

              <div className="flex justify-between mb-8">
                <span className="font-display font-semibold text-on-surface">Total</span>
                <span className="font-display font-bold text-xl text-on-surface">
                  {formatCurrency(cartTotal)}
                </span>
              </div>

              {checkoutError && (
                <div className="mb-6 bg-[#9f403d]/8 border-l-2 border-[#9f403d] px-5 py-4 motion-fade-up">
                  <p className="text-sm text-[#9f403d]">{checkoutError}</p>
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="kinetic-button w-full bg-primary hover:bg-primary-dim text-on-primary px-8 py-4 text-sm font-semibold uppercase tracking-widest transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <Lock className="w-4 h-4" />
                <span>{isCheckingOut ? "Processing..." : "Place Order"}</span>
              </button>

              <p className="text-xs text-on-surface-variant text-center mt-4">
                {deliveryMethod === "cod"
                  ? "Pay in cash when your order arrives (Free Delivery)"
                  : "Your order will be ready for pickup"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
