"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { ShoppingCart, Check, AlertTriangle } from "lucide-react";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/data/products";

// ── Component ──────────────────────────────────────────

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const isOutOfStock = product.stockSqft === 0;
  const isLowStock = product.stockSqft > 0 && product.stockSqft <= 100;

  const handleQuickAdd = useCallback(() => {
    if (isOutOfStock || justAdded) return;

    addToCart(
      {
        id: product.id,
        name: product.name,
        image: product.image,
        category: product.category,
        price_per_sqft: product.pricePerSqft,
      },
      10
    );

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  }, [addToCart, product, isOutOfStock, justAdded]);

  return (
    <div className="group bg-surface-container-lowest premium-shadow hover:premium-shadow-lg transition-shadow duration-500">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-surface-container">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700"
        />

        {/* Low Stock Badge */}
        {isLowStock && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-[#9f403d]/90 backdrop-blur-sm px-3 py-1.5">
            <AlertTriangle className="w-3 h-3 text-white" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white">
              Low Stock
            </span>
          </div>
        )}

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 z-10 bg-black/40 flex items-center justify-center">
            <span className="text-xs font-bold uppercase tracking-widest text-white/90 bg-black/50 backdrop-blur-sm px-5 py-2.5">
              Out of Stock
            </span>
          </div>
        )}

        {/* Hover Overlay with Quick Add */}
        {!isOutOfStock && (
          <div className="product-card-overlay">
            <button
              onClick={handleQuickAdd}
              disabled={justAdded}
              className={`overlay-btn px-6 py-3 text-xs font-semibold uppercase tracking-widest transition-colors flex items-center gap-2 ${
                justAdded
                  ? "bg-primary text-on-primary"
                  : "bg-white text-on-surface hover:bg-accent hover:text-on-accent"
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Added to Cart</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Quick Add</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-5 space-y-2">
        <p className="text-xs uppercase tracking-widest text-accent">{product.category}</p>
        <h3 className="text-lg font-display font-semibold text-on-surface">{product.name}</h3>

        {/* Metadata row */}
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <span>{product.dimensions}</span>
          <span className="w-1 h-1 rounded-full bg-outline-variant" />
          <span>{product.finish}</span>
        </div>

        {/* Price + Quick Add row */}
        <div className="flex items-center justify-between pt-1">
          <span className="font-bold text-sm text-on-surface">
            {product.price} / sq ft
          </span>
          <button
            onClick={handleQuickAdd}
            disabled={isOutOfStock || justAdded}
            className={`flex items-center gap-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest transition-all duration-300 ${
              isOutOfStock
                ? "bg-surface-container-high text-on-surface-variant/50 cursor-not-allowed"
                : justAdded
                ? "bg-primary/10 text-primary"
                : "bg-surface-container-high text-on-surface-variant hover:bg-accent hover:text-on-accent"
            }`}
          >
            {isOutOfStock ? (
              "Sold Out"
            ) : justAdded ? (
              <>
                <Check className="w-3 h-3" />
                Added ✓
              </>
            ) : (
              <>
                <ShoppingCart className="w-3 h-3" />
                + Add
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
