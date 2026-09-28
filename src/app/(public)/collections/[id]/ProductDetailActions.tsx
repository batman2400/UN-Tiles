"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ShoppingCart, Check, Calculator, Sparkles, AlertTriangle, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/data/products";
import { productHasParsableSize } from "@/lib/tile-planner";

export function ProductDetailActions({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [qty, setQty] = useState(10);
  const [justAdded, setJustAdded] = useState(false);

  const isOutOfStock = product.stockSqft === 0;

  const handleAddToCart = useCallback(() => {
    if (isOutOfStock || justAdded) return;

    if (qty > product.stockSqft) {
      alert(`Only ${product.stockSqft} sqft available in stock.`);
      setQty(product.stockSqft);
      return;
    }

    const added = addToCart(
      {
        id: product.id,
        name: product.name,
        image: product.image,
        category: product.category,
        price_per_sqft: product.pricePerSqft,
        stockSqft: product.stockSqft,
      },
      qty
    );

    if (!added) {
      alert(`Cannot add more to cart. You may have reached the maximum available stock of ${product.stockSqft} sqft.`);
      return;
    }

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  }, [addToCart, product, isOutOfStock, justAdded, qty]);

  return (
    <div className="space-y-6 pt-4 border-t border-outline/20">
      {/* Price Calculation Row */}
      <div className="flex items-baseline justify-between">
        <div>
          <span className="text-3xl font-display font-bold text-on-surface">
            {new Intl.NumberFormat("en-LK", {
              style: "currency",
              currency: "LKR",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(product.pricePerSqft * qty)}
          </span>
          <span className="text-xs text-on-surface-variant block mt-0.5">
            Total for {qty} sq ft (at {new Intl.NumberFormat("en-LK", {
              style: "currency",
              currency: "LKR",
              minimumFractionDigits: 0,
            }).format(product.pricePerSqft)} / sq ft)
          </span>
        </div>

        {/* Stock status indicator */}
        <div>
          {isOutOfStock ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Out of Stock</span>
            </span>
          ) : product.stockSqft <= 100 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Low Stock: {product.stockSqft} sq ft left</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>In Stock: {product.stockSqft} sq ft</span>
            </span>
          )}
        </div>
      </div>

      {/* Quantity & Add to Cart Controls */}
      {!isOutOfStock && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center border border-outline rounded-xl bg-surface-container/40 px-3 py-2 shrink-0">
            <label htmlFor="quantity" className="text-xs font-semibold text-on-surface-variant mr-3">
              Quantity (sq ft):
            </label>
            <input
              id="quantity"
              type="number"
              min={1}
              max={product.stockSqft}
              value={qty}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                setQty(Math.min(product.stockSqft, Math.max(1, val)));
              }}
              className="w-16 text-center font-bold text-sm bg-transparent outline-none text-on-surface"
            />
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={justAdded}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-semibold uppercase tracking-wider transition-all duration-300 shadow-md ${
              justAdded
                ? "bg-emerald-600 text-white"
                : "bg-zinc-900 hover:bg-black text-white"
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4" />
                <span>Added to Cart</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart &amp; Buy</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Auxiliary Actions: Smart Planner & AI Finder */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        {productHasParsableSize(product.dimensions) && (
          <Link
            href={`/planner?product=${encodeURIComponent(product.id)}`}
            className="flex items-center justify-between p-3.5 rounded-xl border border-outline/40 bg-surface-container/30 hover:bg-surface-container transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <Calculator className="w-4 h-4 text-accent" />
              <span className="text-xs font-semibold text-on-surface">Plan Room &amp; Cuts</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-on-surface-variant group-hover:translate-x-1 transition-transform" />
          </Link>
        )}

        <Link
          href="/visual-search"
          className="flex items-center justify-between p-3.5 rounded-xl border border-accent/30 bg-accent/5 hover:bg-accent/10 transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-xs font-semibold text-accent">Find Similar with AI</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-accent group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
