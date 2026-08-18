"use client";

import { Check, ShoppingCart } from "lucide-react";
import type { PlannerResult } from "@/lib/tile-planner";
import { mm2ToSqft } from "@/lib/tile-planner";

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-bold text-zinc-900 tabular-nums">{value}</p>
    </div>
  );
}

export function ResultsPanel({
  result,
  pricePerSqft,
  stockSqft,
  onAddToCart,
  justAdded,
  disabledReason,
}: {
  result: PlannerResult;
  pricePerSqft: number;
  stockSqft: number;
  onAddToCart: () => void;
  justAdded: boolean;
  disabledReason: string | null;
}) {
  const roomSqft = mm2ToSqft(result.roomAreaMm2);
  const wastePct = Math.round(result.wastePct * 1000) / 10;
  const total = result.recommendedSqft * pricePerSqft;
  const overStock = result.recommendedSqft > stockSqft;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 space-y-4">
      {/* ── Hero summary ── */}
      <div className="rounded-xl bg-accent/8 border border-accent/20 px-4 py-4 space-y-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-accent mb-1">
            Recommended to buy
          </p>
          <p className="text-2xl sm:text-3xl font-display font-bold text-zinc-900 tabular-nums">
            {result.recommendedSqft} sq ft
          </p>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-gray-400">Estimated total</p>
            <p className="text-xl font-display font-bold text-zinc-900">{formatPrice(total)}</p>
          </div>
          {overStock && (
            <p className="text-xs text-[#9f403d] font-medium text-right">
              Only {stockSqft} sq ft in stock
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onAddToCart}
          disabled={Boolean(disabledReason) || justAdded}
          className={`w-full min-h-12 inline-flex items-center justify-center gap-2 rounded-xl text-xs font-semibold uppercase tracking-widest transition-colors ${
            justAdded
              ? "bg-primary/10 text-primary"
              : disabledReason
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-accent text-white hover:bg-accent/90"
          }`}
        >
          {justAdded ? (
            <>
              <Check className="w-4 h-4" />
              Added to cart
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              Add {result.recommendedSqft} sq ft to cart
            </>
          )}
        </button>
        {disabledReason && !justAdded && (
          <p className="text-xs text-[#9f403d]">{disabledReason}</p>
        )}
      </div>

      {/* ── Detailed stats ── */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
          Layout breakdown
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <Stat label="Room area" value={`${roomSqft.toFixed(1)} sq ft`} />
          <Stat label="Uncut tiles" value={String(result.fullCount)} />
          <Stat label="Cut pieces" value={String(result.cutCount)} />
          <Stat label="Total tiles needed" value={String(result.physicalTiles)} />
          <Stat label="Waste" value={`${wastePct}%`} />
          <Stat label="Buy" value={`${result.recommendedSqft} sq ft`} />
        </div>
      </div>

      <p className="text-[11px] text-gray-400 leading-relaxed">
        Estimate only. Cut pairing reuses leftover strips from the same tile where they fit.
        Pattern matching, site cuts, and breakage can change the quantity you actually need.
      </p>
    </div>
  );
}

