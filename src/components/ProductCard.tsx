"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
  const initialQty = product.stockSqft > 0 ? Math.min(10, product.stockSqft) : 1;
  const [qty, setQty] = useState(initialQty);
  const [qtyInput, setQtyInput] = useState(String(initialQty));
  const [stockNotice, setStockNotice] = useState<string | null>(null);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
      if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    };
  }, []);

  const showNotice = useCallback((message: string) => {
    setStockNotice(message);
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = setTimeout(() => setStockNotice(null), 3500);
  }, []);

  const isOutOfStock = product.stockSqft === 0;
  const isLowStock = product.stockSqft > 0 && product.stockSqft <= 100;

  const commitQtyDraft = useCallback((): number => {
    const parsed = parseInt(qtyInput, 10);
    if (isNaN(parsed) || parsed < 1) {
      setQty(1);
      setQtyInput("1");
      return 1;
    }
    if (product.stockSqft > 0 && parsed > product.stockSqft) {
      setQty(product.stockSqft);
      setQtyInput(String(product.stockSqft));
      showNotice(`Only ${product.stockSqft} sq\u00A0ft available in stock.`);
      return product.stockSqft;
    }
    setQty(parsed);
    setQtyInput(String(parsed));
    return parsed;
  }, [qtyInput, product.stockSqft, showNotice]);

  const handleQuickAdd = useCallback(() => {
    if (isOutOfStock || justAdded) return;

    const targetQty = commitQtyDraft();

    const added = addToCart(
      {
        id: product.id,
        name: product.name,
        image: product.image,
        category: product.category,
        price_per_sqft: product.pricePerSqft,
        stockSqft: product.stockSqft,
      },
      targetQty
    );

    if (!added) {
      showNotice(
        `Max stock reached (${product.stockSqft} sq\u00A0ft total in warehouse).`
      );
      return;
    }

    setStockNotice(null);
    setJustAdded(true);
    if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    addedTimerRef.current = setTimeout(() => setJustAdded(false), 1800);
  }, [addToCart, commitQtyDraft, product, isOutOfStock, justAdded, showNotice]);

  return (
    <div className="group flex h-full min-w-0 flex-col bg-surface-container-lowest premium-shadow hover:premium-shadow-lg transition-shadow duration-500 rounded-2xl overflow-hidden">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-surface-container">
        <Link
          href={`/collections/${product.id}`}
          className="absolute inset-0 z-0"
          aria-label={`Buy ${product.name} tile in Sri Lanka`}
        >
          <Image
            src={product.image || "/tiles/floor_agaria.jpg"}
            alt={`Buy ${product.name} tile in Sri Lanka`}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            priority={priority}
          />
        </Link>

        {/* Low Stock Badge */}
        {isLowStock && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-[#9f403d]/90 backdrop-blur-sm px-3 py-1.5 pointer-events-none">
            <AlertTriangle className="w-3 h-3 text-white" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white">
              Low Stock
            </span>
          </div>
        )}

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 z-10 bg-black/40 flex items-center justify-center pointer-events-none">
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
          <Link href={`/collections/${product.id}`} className="hover:text-accent transition-colors">
            {product.name}
          </Link>
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

        {/* Inline stock notice */}
        {stockNotice && (
          <p role="status" className="text-[11px] font-medium text-[#9f403d] leading-snug">
            {stockNotice}
          </p>
        )}

        {/* Price + Quick Add row */}
        <div className="mt-auto flex min-w-0 flex-col gap-2 pt-2 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm text-on-surface truncate">
              {new Intl.NumberFormat("en-LK", {
                style: "currency",
                currency: "LKR",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(product.pricePerSqft * qty)}
            </span>
            <span className="text-[10px] text-on-surface-variant truncate">
              {new Intl.NumberFormat("en-LK", {
                style: "currency",
                currency: "LKR",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(product.pricePerSqft)} / sq&nbsp;ft
            </span>
          </div>
          <div className="flex w-full min-w-0 items-center gap-1.5 sm:gap-2 xl:w-auto xl:justify-end">
            {!isOutOfStock && (
              <div className="relative flex items-center shrink-0">
                <input
                  type="text"
                  inputMode="numeric"
                  aria-label="Quantity in square feet"
                  title="Quantity in sq ft"
                  value={qtyInput}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (!/^\d*$/.test(raw)) return;
                    setQtyInput(raw);
                    if (raw) {
                      const parsed = parseInt(raw, 10);
                      if (parsed >= 1) {
                        setQty(Math.min(parsed, product.stockSqft));
                      }
                    }
                  }}
                  onBlur={() => {
                    commitQtyDraft();
                  }}
                  className="w-12 sm:w-14 xl:w-16 min-h-10 shrink-0 px-1.5 sm:pr-7 sm:pl-2 py-1.5 text-xs font-medium border border-outline/60 bg-transparent rounded-lg outline-none focus:border-accent text-center sm:text-left"
                  disabled={justAdded}
                />
                <span className="hidden sm:inline pointer-events-none absolute right-2 text-[9px] font-semibold text-on-surface-variant uppercase">
                  ft²
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={isOutOfStock || justAdded}
              className={`flex min-h-10 min-w-0 flex-1 items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-2 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider sm:tracking-widest whitespace-nowrap overflow-hidden rounded-lg xl:flex-initial transition-all duration-300 ${
                isOutOfStock
                  ? "bg-surface-container-high text-on-surface-variant/50 cursor-not-allowed w-full"
                  : justAdded
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-900 text-white hover:bg-accent shadow-sm"
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
