"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { ShoppingCart, Check, AlertTriangle } from "lucide-react";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/data/products";

// ── Component ──────────────────────────────────────────

export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const { addToCart } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const [qty, setQty] = useState(10);

  const isOutOfStock = product.stockSqft === 0;
  const isLowStock = product.stockSqft > 0 && product.stockSqft <= 100;

  const handleQuickAdd = useCallback(() => {
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
        stockSqft: product.stockSqft, // Ensure stock is passed to cart
      },
      qty
    );

    if (!added) {
      alert(`Cannot add more to cart. You may have reached the maximum available stock of ${product.stockSqft} sqft.`);
      return;
    }

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  }, [addToCart, product, isOutOfStock, justAdded, qty]);

  return (
    <div className="group bg-surface-container-lowest premium-shadow hover:premium-shadow-lg transition-shadow duration-500 rounded-2xl overflow-hidden">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-surface-container">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-700"
          priority={priority}
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
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between pt-1 gap-2 min-w-0">
          <div className="flex flex-col min-w-0 w-full xl:w-auto">
            <span className="font-bold text-sm text-on-surface truncate">
              {new Intl.NumberFormat("en-LK", {
                style: "currency",
                currency: "LKR",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(product.pricePerSqft * qty)}
            </span>
          </div>
          <div className="hidden sm:flex flex-shrink-0 justify-end items-center gap-2">
            {!isOutOfStock && (
              <input
                type="number"
                min={1}
                max={product.stockSqft}
                value={qty}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  if (val > product.stockSqft) {
                    alert(`Only ${product.stockSqft} sqft available in stock.`);
                    setQty(product.stockSqft);
                  } else {
                    setQty(Math.max(1, val));
                  }
                }}
                className="w-14 min-h-10 px-2 py-1.5 text-xs border border-outline bg-transparent rounded outline-none focus:border-primary text-center"
                disabled={justAdded}
              />
            )}
            <button
              onClick={handleQuickAdd}
              disabled={isOutOfStock || justAdded}
              className={`flex items-center justify-center gap-2 min-h-10 px-3 sm:px-4 py-2 text-[11px] font-semibold uppercase tracking-widest transition-all duration-300 whitespace-nowrap rounded ${
                isOutOfStock
                  ? "bg-surface-container-high text-on-surface-variant/50 cursor-not-allowed w-full"
                  : justAdded
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-container-high text-on-surface-variant hover:bg-accent hover:text-white hover:scale-105"
              }`}
            >
              {isOutOfStock ? (
                "Sold Out"
              ) : justAdded ? (
                <>
                  <Check className="w-3 h-3" />
                  Added
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3 h-3" />
                  Add
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
