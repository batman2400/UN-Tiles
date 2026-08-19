"use client";

import { useState } from "react";
import type { SceneBrief } from "@/lib/visual-search/types";
import { Sparkles, Sun, Palette, Compass, Layers, Check, Copy } from "lucide-react";

interface SceneBriefPanelProps {
  brief: SceneBrief;
}

export function SceneBriefPanel({ brief }: SceneBriefPanelProps) {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-stone-900 via-zinc-900 to-stone-950 text-white rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl overflow-hidden relative">
      {/* Subtle background glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400">
              AI Architectural Brief
            </p>
            <h3 className="text-xl sm:text-2xl font-display font-semibold text-white">
              {brief.roomType}
            </h3>
          </div>
        </div>

        {/* Lighting badge */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full text-xs text-stone-300">
          <Sun className="w-3.5 h-3.5 text-amber-300" />
          <span>{brief.lighting}</span>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: AI Interior Concept */}
        <div className="md:col-span-7 space-y-4">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-stone-400 font-semibold block mb-2">
              Design Direction & Recommendation
            </span>
            <p className="text-base sm:text-lg font-light leading-relaxed text-stone-100 italic bg-white/[0.03] border-l-2 border-amber-400 p-4 rounded-r-xl">
              &ldquo;{brief.idealTileQuery}&rdquo;
            </p>
          </div>

          {/* Style Tags & Surfaces */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-stone-400" />
              <span className="text-xs text-stone-400">Aesthetics:</span>
              <div className="flex flex-wrap gap-1.5">
                {brief.styleTags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-white/10 text-stone-200 border border-white/5"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {brief.surfaces && (
              <div className="flex items-center gap-2 text-xs text-stone-400">
                <Layers className="w-4 h-4 text-stone-400" />
                <span>Focus:</span>
                <span className="text-stone-200 font-medium">{brief.surfaces}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Palette Swatches */}
        <div className="md:col-span-5 bg-white/[0.04] border border-white/10 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-300">
                Extracted Palette
              </span>
            </div>
            <span className="text-[10px] text-stone-400">Click to copy</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {brief.palette.map((hex) => {
              const isCopied = copiedHex === hex;
              return (
                <button
                  key={hex}
                  onClick={() => handleCopyHex(hex)}
                  title={`Copy ${hex}`}
                  className="group/swatch relative flex flex-col items-center gap-1.5 p-2 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 hover:border-amber-400/50 transition-all text-left"
                >
                  <div
                    className="w-full aspect-square rounded-lg shadow-inner border border-white/10 relative overflow-hidden"
                    style={{ backgroundColor: hex }}
                  >
                    {isCopied && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center text-white">
                        <Check className="w-4 h-4 text-emerald-400" />
                      </div>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-stone-300 group-hover/swatch:text-amber-300 uppercase tracking-wider flex items-center gap-1">
                    {hex}
                    <Copy className="w-2.5 h-2.5 opacity-0 group-hover/swatch:opacity-100 transition-opacity" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
