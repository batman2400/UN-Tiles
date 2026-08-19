"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, Lightbulb } from "lucide-react";
import type { BestFitCandidate } from "@/lib/tile-planner";

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function fmtWaste(pct: number): string {
  return `${Math.round(pct * 1000) / 10}%`;
}

function CandidateRow({
  candidate,
  currentWastePct,
  onSwitch,
  featured,
}: {
  candidate: BestFitCandidate;
  currentWastePct: number;
  onSwitch: () => void;
  featured?: boolean;
}) {
  const reductionPP =
    Math.round(currentWastePct * 1000) / 10 -
    Math.round(candidate.wastePct * 1000) / 10;

  return (
    <div
      className={`flex items-start gap-3 ${
        featured ? "" : "pt-3 border-t border-accent/10"
      }`}
    >
      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        <Image
          src={candidate.image}
          alt=""
          fill
          sizes="48px"
          className="object-cover"
        />
      </span>

      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="text-sm font-semibold text-zinc-900 truncate">
          {candidate.productName}
        </p>
        <p className="text-[11px] text-gray-500">
          {candidate.dimensions} · {candidate.category}
        </p>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Waste badge */}
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {fmtWaste(candidate.wastePct)} waste
          </span>

          {/* Reduction pill */}
          {reductionPP > 0 && (
            <span className="inline-flex items-center rounded-full bg-emerald-700/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              ↓ {reductionPP.toFixed(1)}% less
            </span>
          )}
        </div>

        {/* Cost savings */}
        {candidate.savingsVsCurrent > 0 && (
          <p className="text-[11px] text-emerald-700 font-medium">
            Save {formatPrice(candidate.savingsVsCurrent)}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onSwitch}
        className="shrink-0 self-center min-h-8 px-3 rounded-lg bg-accent text-white text-[11px] font-semibold uppercase tracking-wider hover:bg-accent/90 transition-colors"
      >
        Switch
      </button>
    </div>
  );
}

export function BestFitSuggestion({
  candidates,
  currentWastePct,
  onSwitchTile,
}: {
  candidates: BestFitCandidate[];
  currentWastePct: number;
  onSwitchTile: (candidate: BestFitCandidate) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  if (candidates.length === 0) return null;

  const [top, ...rest] = candidates;

  return (
    <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4 sm:p-5 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-accent shrink-0" />
        <p className="text-[11px] font-semibold uppercase tracking-widest text-accent">
          Smart Size Optimization
        </p>
      </div>

      {/* Top candidate */}
      <CandidateRow
        candidate={top}
        currentWastePct={currentWastePct}
        onSwitch={() => onSwitchTile(top)}
        featured
      />

      {/* More alternatives */}
      {rest.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-accent hover:text-accent/80 transition-colors"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                expanded ? "rotate-180" : ""
              }`}
            />
            {rest.length} more alternative{rest.length > 1 ? "s" : ""}
          </button>

          {expanded && (
            <div className="space-y-3">
              {rest.map((c) => (
                <CandidateRow
                  key={c.productId}
                  candidate={c}
                  currentWastePct={currentWastePct}
                  onSwitch={() => onSwitchTile(c)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <p className="text-[10px] text-gray-400 leading-relaxed">
        Based on optimized layouts for your room dimensions. Actual waste may
        vary with pattern matching and site conditions.
      </p>
    </div>
  );
}
