"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa6";
import { Sparkles, Calculator, ArrowRight } from "lucide-react";

export interface HeroAction {
  label: string;
  href: string;
  badge?: string;
  icon?: React.ReactNode;
}

export interface Hero10NavItem {
  label: string;
  href: string;
  hasMenu?: boolean;
}

export interface Hero10Props {
  brandName?: string;
  navItems?: Hero10NavItem[];
  ctaText?: string;
  ctaHref?: string;
  eyebrowText?: string;
  title?: string;
  description?: string;
  primaryText?: string;
  primaryHref?: string;
  secondaryActions?: HeroAction[];
  bottomLabel?: string;
  usersText?: string;
  backgroundImage?: string;
}

const defaultBackground = "/images/light_luxury_tiles.jpg";

export function Hero10({
  eyebrowText = "Premium Architectural Tiles",
  title = "Materializing Vision.\nElevating Spaces.",
  description = "",
  primaryText = "Buy Tiles Online",
  primaryHref = "/collections",
  studioText = "Explore AI & Studio Tools",
  studioHref = "#studio",
  usersText = "500+ Projects Completed",
  backgroundImage = defaultBackground,
}: Hero10Props & { studioText?: string; studioHref?: string }) {
  return (
    <section
      className="relative isolate min-h-[100svh] w-full overflow-hidden bg-background font-sans text-slate-900 antialiased"
    >
      <Image
        src={backgroundImage}
        alt=""
        fill
        priority
        sizes="100vw"
        unoptimized
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      {/* ── Natural luxury overlay (Vibrant, crisp photo without milky haze) ── */}
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(250,248,245,0.42)_0%,rgba(250,248,245,0.18)_35%,rgba(250,248,245,0.05)_65%,rgba(15,23,42,0.12)_100%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1440px] flex-col px-4 py-4 sm:px-10 lg:px-[74px]">
        <div className="mx-auto flex w-full max-w-[780px] flex-1 flex-col items-center justify-start pt-[90px] text-center sm:pt-[98px] lg:pt-[76px]">
          {/* Eyebrow badge */}
          <div className="inline-flex min-h-7 max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-slate-700/12 bg-white/40 px-3.5 py-1.5 text-[11px] leading-none font-semibold text-slate-700 shadow-sm backdrop-blur-md">
            <span className="grid size-4 place-items-center rounded-full border border-accent/40 bg-accent/20">
              <span className="size-2 rounded-full bg-accent" />
            </span>
            <span>{eyebrowText}</span>
          </div>

          {/* Main Title - Refined, balanced editorial typography */}
          <h1 className="mt-5 max-w-4xl font-serif text-[clamp(2.15rem,5.5vw,3.5rem)] leading-[1.15] sm:leading-[1.08] font-medium tracking-tight text-balance whitespace-pre-line text-slate-900 drop-shadow-[0_2px_14px_rgba(255,255,255,0.95)]">
            {title}
          </h1>

          {/* Description - Crisp, clean, readable */}
          {description && (
            <p className="mt-4 sm:mt-5 max-w-[580px] px-2 text-[0.95rem] leading-[1.55] font-normal text-pretty text-slate-800 sm:text-[1.05rem] drop-shadow-[0_1px_10px_rgba(255,255,255,0.95)]">
              {description}
            </p>
          )}

          {/* ── Refined Dual Action Buttons ── */}
          <div className="mt-7 sm:mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {/* Primary Action: Collections */}
            <motion.a
              href={primaryHref}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex h-12 items-center gap-2.5 rounded-full bg-zinc-900 px-7 text-xs sm:text-sm font-semibold uppercase tracking-wider text-white shadow-md hover:bg-black transition-all"
            >
              <span>{primaryText}</span>
              <ArrowRight className="w-4 h-4" />
            </motion.a>

            {/* Studio Tools Hub Action */}
            <motion.a
              href={studioHref}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex h-12 items-center gap-2 rounded-full border border-slate-700/15 bg-white/50 px-6 text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-900 shadow-sm backdrop-blur-md hover:bg-white/80 hover:border-accent transition-all group"
            >
              <Sparkles className="w-4 h-4 text-accent transition-transform group-hover:scale-110" />
              <span>{studioText}</span>
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                AI & 2D
              </span>
            </motion.a>
          </div>
        </div>

        {/* Bottom trust pill */}
        <div className="mb-[max(0.75rem,env(safe-area-inset-bottom))] flex flex-col items-center gap-4 sm:mb-7 sm:flex-row sm:items-end sm:justify-center">
          <div className="inline-flex w-fit max-w-full items-center gap-3 rounded-full bg-white/50 px-4 py-1.5 text-xs sm:text-sm font-semibold text-slate-800 shadow-sm backdrop-blur-md border border-white/40">
            <span className="grid size-6 place-items-center rounded-full bg-slate-900 text-white">
              <FaArrowRight className="size-2.5 -rotate-45" />
            </span>
            <span>{usersText}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
