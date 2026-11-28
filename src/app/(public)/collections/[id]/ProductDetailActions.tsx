"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { ShoppingCart, Check, Calculator, AlertTriangle, ArrowRight } from "lucide-react";
import { AiFeatureIcon } from "@/components/ui/AiFeatureIcon";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/data/products";
import { productHasParsableSize } from "@/lib/tile-planner";

export function ProductDetailActions({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const initialQty = product.stockSqft > 0 ? Math.min(10, product.stockSqft) : 1;
  const [qty, setQty] = useState(initialQty);
  const [qtyInput, setQtyInput] = useState(String(initialQty));
  const [justAdded, setJustAdded] = useState(false);
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

  const handleAddToCart = useCallback(() => {
    if (isOutOfStock || justAdded) return;

    const targetQty = commitQtyDraft();

    const added = addToCart(
      {
        id: product.id,
        name: product.name,
        image: product.image || "/tiles/floor_agaria.jpg",
        category: product.category,
        price_per_sqft: product.pricePerSqft,
        stockSqft: product.stockSqft,
      },
      targetQty
    );

    if (!added) {
      showNotice(
        `Cannot add more to cart. Maximum available stock is ${product.stockSqft} sq\u00A0ft.`
      );
      return;
    }

    setStockNotice(null);
    setJustAdded(true);
    if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    addedTimerRef.current = setTimeout(() => setJustAdded(false), 2000);
  }, [addToCart, commitQtyDraft, product, isOutOfStock, justAdded, showNotice]);

  return (
    <div className="space-y-6 pt-4 border-t border-outline/20">
      {/* Price Calculation Row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
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
            Total for {qty}&nbsp;sq&nbsp;ft (at {new Intl.NumberFormat("en-LK", {
              style: "currency",
              currency: "LKR",
              minimumFractionDigits: 0,
            }).format(product.pricePerSqft)}&nbsp;/&nbsp;sq&nbsp;ft)
          </span>
        </div>

        {/* Stock status indicator */}
        <div className="shrink-0">
          {isOutOfStock ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold whitespace-nowrap">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Out of Stock</span>
            </span>
          ) : product.stockSqft <= 100 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold whitespace-nowrap">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Low Stock: {product.stockSqft}&nbsp;sq&nbsp;ft left</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>In Stock: {product.stockSqft}&nbsp;sq&nbsp;ft</span>
            </span>
          )}
        </div>
      </div>

      {/* Quantity & Add to Cart Controls */}
      {!isOutOfStock && (
        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center justify-between sm:justify-start border border-outline rounded-xl bg-surface-container/40 px-3.5 py-2 shrink-0">
              <label htmlFor="quantity" className="text-xs font-semibold text-on-surface-variant mr-3 whitespace-nowrap">
                Quantity (sq&nbsp;ft):
              </label>
              <input
                id="quantity"
                type="text"
                inputMode="numeric"
                value={qtyInput}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (!/^\d*$/.test(raw)) return;
                  setQtyInput(raw);
                  if (raw) {
                    const parsed = parseInt(raw, 10);
                    if (parsed >= 1) {
                      setQty(Math.min(product.stockSqft, parsed));
                    }
                  }
                }}
                onBlur={() => {
                  commitQtyDraft();
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
                  : "bg-zinc-900 hover:bg-accent text-white"
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

          {stockNotice && (
            <p role="status" className="text-xs font-semibold text-[#9f403d]">
              {stockNotice}
            </p>
          )}
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
            <AiFeatureIcon className="w-4 h-4 text-accent" />
            <span className="text-xs font-semibold text-accent">Find Similar with AI</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-accent group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
