"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Check, AlertTriangle } from "lucide-react";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/data/products";
import { productHasParsableSize } from "@/lib/tile-planner";

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
    <div className="group flex h-full min-w-0 flex-col bg-surface-container-lowest premium-shadow hover:premium-shadow-lg transition-shadow duration-500 rounded-2xl overflow-hidden">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-surface-container">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 1024px) 50vw, 33vw"
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
          <div className="hidden sm:block">
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
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 min-w-0 flex-col p-3 sm:p-5 space-y-1.5 sm:space-y-2">
        <p className="text-[10px] sm:text-xs uppercase tracking-widest text-accent truncate">{product.category}</p>
        <h3 className="text-sm sm:text-lg font-display font-semibold text-on-surface line-clamp-2 leading-snug min-h-[2.5rem] sm:min-h-[3.25rem]">
          {product.name}
        </h3>

        {/* Metadata row */}
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-on-surface-variant">
          <span className="truncate">{product.dimensions}</span>
          <span className="w-1 h-1 shrink-0 rounded-full bg-outline-variant" />
          <span className="truncate">{product.finish}</span>
        </div>
        {productHasParsableSize(product.dimensions) && (
          <Link
            href={`/planner?product=${encodeURIComponent(product.id)}`}
            className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-accent hover:underline w-fit"
          >
            Plan this room
          </Link>
        )}

        {/* Price + Quick Add row */}
        <div className="mt-auto flex min-w-0 flex-col gap-2 pt-2 xl:flex-row xl:items-center xl:justify-between">
          <span className="font-bold text-sm text-on-surface truncate">
            {new Intl.NumberFormat("en-LK", {
              style: "currency",
              currency: "LKR",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(product.pricePerSqft * qty)}
          </span>
          <div className="flex w-full min-w-0 items-center gap-1.5 sm:gap-2 xl:w-auto xl:justify-end">
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
                className="w-11 sm:w-14 min-h-10 shrink-0 px-1 sm:px-2 py-1.5 text-xs border border-outline bg-transparent rounded outline-none focus:border-primary text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                disabled={justAdded}
              />
            )}
            <button
              onClick={handleQuickAdd}
              disabled={isOutOfStock || justAdded}
              className={`flex min-h-10 min-w-0 flex-1 items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider sm:tracking-widest whitespace-nowrap overflow-hidden rounded xl:flex-initial transition-all duration-300 ${
                isOutOfStock
                  ? "bg-surface-container-high text-on-surface-variant/50 cursor-not-allowed w-full"
                  : justAdded
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-container-high text-on-surface-variant hover:bg-accent hover:text-white sm:hover:scale-105"
              }`}
            >
              {isOutOfStock ? (
                "Sold Out"
              ) : justAdded ? (
                <>
                  <Check className="w-3 h-3 shrink-0" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3 h-3 shrink-0" />
                  <span>Add</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
