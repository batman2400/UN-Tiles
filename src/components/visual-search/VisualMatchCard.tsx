"use client";

import { ProductCard } from "@/components/ProductCard";
import type { MatchedProduct } from "@/lib/visual-search/types";
import { AiFeatureIcon } from "@/components/ui/AiFeatureIcon";

interface VisualMatchCardProps {
  product: MatchedProduct;
  rank?: number;
  priority?: boolean;
}

export function VisualMatchCard({ product, rank, priority = false }: VisualMatchCardProps) {
  const percentage = product.similarityPercentage;

  const getBadgeStyle = () => {
    if (percentage >= 85) {
      return "bg-amber-700/90 text-white border-amber-500/40 shadow-sm";
    }
    if (percentage >= 70) {
      return "bg-stone-800/90 text-amber-200 border-stone-600/40 shadow-sm";
    }
    return "bg-stone-700/80 text-stone-200 border-stone-500/30";
  };

  const showRank = typeof rank === "number" && rank <= 3;

  return (
    <div className="relative group/match flex flex-col h-full">
      {/* Unified Similarity + Top-3 Rank Badge (avoids overlapping Low Stock badge on left) */}
      <div className="absolute top-3 right-3 z-20 pointer-events-none">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide backdrop-blur-md border ${getBadgeStyle()} transition-transform duration-300 group-hover/match:scale-105`}
        >
          <AiFeatureIcon className="w-3 h-3 text-amber-300 shrink-0" />
          <span>{showRank ? `#${rank} · ${percentage}% Match` : `${percentage}% Match`}</span>
        </div>
      </div>

      {/* Standard UN Tiles Product Card */}
      <div className="flex-1">
        <ProductCard product={product} priority={priority} />
      </div>
    </div>
  );
}
