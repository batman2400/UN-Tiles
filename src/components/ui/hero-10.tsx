"use client";

import { motion } from "motion/react";
import { FaArrowRight } from "react-icons/fa6";

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
  bottomLabel?: string;
  usersText?: string;
  backgroundImage?: string;
}

const defaultBackground = "/images/light_luxury_tiles.jpg";

export function Hero10({
  eyebrowText = "Premium Architectural Tiles",
  title = "Materializing Vision.\nElevating Spaces.",
  description = "Architectural precision in high-end tiling. Structural integrity meets timeless design in every square foot.",
  primaryText = "View Collections",
  primaryHref = "/collections",
  usersText = "500+ Projects Completed",
  backgroundImage = defaultBackground,
}: Hero10Props) {
  return (
    <section
      className="relative isolate min-h-[100svh] w-full overflow-hidden bg-background font-sans text-slate-900 antialiased"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <img
        src={backgroundImage}
        alt=""
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(250,248,245,0.42)_0%,rgba(250,248,245,0.18)_36%,rgba(250,248,245,0.04)_66%,rgba(15,23,42,0.08)_100%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1440px] flex-col px-4 py-4 sm:px-10 lg:px-[74px]">
        <div className="mx-auto flex w-full max-w-[760px] flex-1 flex-col items-center justify-center pt-[88px] text-center sm:justify-start sm:pt-[94px] lg:pt-[68px]">
          <div className="inline-flex min-h-7 max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-slate-700/13 bg-white/18 px-3 py-1.5 text-[11px] leading-none font-medium text-slate-600 shadow-[0_1px_1px_rgba(255,255,255,0.45)_inset] backdrop-blur-md">
            <span className="grid size-4 place-items-center rounded-full border border-slate-500/30 bg-slate-100/70">
              <span className="size-2 rounded-full bg-slate-700 shadow-[0_0_0_2px_rgba(51,65,85,0.1)]" />
            </span>
            <span>{eyebrowText}</span>
          </div>

          <h1 className="mt-5 max-w-5xl font-serif text-[clamp(2.15rem,9vw,5.35rem)] leading-[1.1] sm:leading-[0.95] font-medium tracking-[-0.06em] text-balance whitespace-pre-line text-slate-700">
            {title}
          </h1>

          <p className="mt-5 max-w-[570px] px-1 text-[0.95rem] leading-[1.5] font-normal text-pretty whitespace-pre-line text-slate-900 sm:mt-6 sm:text-[clamp(1rem,1.35vw,1.16rem)] sm:leading-[1.42] sm:text-slate-700">
            {description}
          </p>

          <motion.a
            href={primaryHref}
            whileTap={{ scale: 0.96 }}
            className="text-md mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-linear-to-b from-blue-700 to-blue-900 px-6 font-normal text-white shadow-[0_1px_2px_rgba(15,23,42,0.18),0_12px_30px_rgba(15,23,42,0.08),inset_0_1px_0_0_var(--color-blue-600),inset_0_-1px_4px_0_var(--color-blue-600)] transition-[background-color,box-shadow,transform] duration-200 ease-out hover:bg-blue-800 hover:shadow-[0_2px_5px_rgba(15,23,42,0.2),0_16px_36px_rgba(15,23,42,0.1)]"
          >
            <span>{primaryText}</span>
            <FaArrowRight className="size-3" />
          </motion.a>
        </div>

        <div className="mb-[max(0.75rem,env(safe-area-inset-bottom))] flex flex-col items-center gap-4 sm:mb-7 sm:flex-row sm:items-end sm:justify-center">
          <div className="inline-flex w-fit max-w-full items-center gap-3 rounded-full bg-white/14 p-px pr-4 text-xs sm:text-sm font-semibold text-slate-800 shadow-[0_0px_1px_rgba(255,255,255,0.5)_inset] backdrop-blur-sm">
            <span className="grid size-7 place-items-center rounded-full bg-slate-800 text-white outline -outline-offset-1 outline-white/10">
              <FaArrowRight className="size-3 -rotate-45" />
            </span>
            <span>{usersText}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
