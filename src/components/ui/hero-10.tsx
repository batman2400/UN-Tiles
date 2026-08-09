"use client";

import { motion, type Variants } from 'motion/react';
import { FaArrowRight } from 'react-icons/fa6';
import Image from 'next/image';

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

const defaultNavItems: Hero10NavItem[] = [
  { label: 'Collections', href: '/collections' },
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

const defaultBackground = '/images/light_luxury_tiles.png';



const contentContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.12,
      staggerChildren: 0.1,
    },
  },
};

const contentItem: Variants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', duration: 0.72, bounce: 0 },
  },
};

const backgroundVariants: Variants = {
  hidden: { opacity: 0, scale: 1.035, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: { type: 'spring', duration: 1.15, bounce: 0 },
  },
};


export function Hero10({
  _brandName = 'UN Tiles',
  _navItems = defaultNavItems,
  _ctaText = 'Explore Tiles',
  _ctaHref = '/collections',
  eyebrowText = 'Premium Architectural Tiles',
  title = 'Materializing Vision.\nElevating Spaces.',
  description = 'Architectural precision in high-end tiling. Structural integrity meets timeless design in every square foot.',
  primaryText = 'View Collections',
  primaryHref = '/collections',
  usersText = '500+ Projects Completed',
  backgroundImage = defaultBackground,
}: Hero10Props) {

  return (
    <section className="relative isolate min-h-screen w-full overflow-hidden bg-slate-200 font-sans text-slate-900 antialiased">
      <motion.div
        variants={backgroundVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.35 }}
        className="absolute inset-0 will-change-transform"
        aria-hidden="true"
      >
        <Image
          src={backgroundImage}
          alt=""
          fill
          priority
          sizes="100vw"
          className="h-full w-full object-cover object-center outline outline-1 outline-black/10"
        />
      </motion.div>

      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(226,232,240,0.82)_0%,rgba(241,245,249,0.58)_32%,rgba(226,232,240,0.08)_66%,rgba(15,23,42,0.08)_100%)]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 top-0 h-[48%] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.82)_0%,rgba(255,255,255,0.4)_42%,rgba(255,255,255,0)_74%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex min-h-[760px] w-full max-w-[1440px] flex-col px-5 py-5 sm:min-h-screen sm:px-10 lg:px-[74px]">

        <motion.div
          variants={contentContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.42 }}
          className="mx-auto flex w-full max-w-[760px] flex-1 flex-col items-center pt-[76px] text-center sm:pt-[94px] lg:pt-[68px]"
        >
          <motion.div
            variants={contentItem}
            className="inline-flex min-h-7 items-center gap-2 rounded-full border border-slate-700/13 bg-white/18 px-3.5 text-[11px] leading-none font-medium text-slate-600 shadow-[0_1px_1px_rgba(255,255,255,0.45)_inset] backdrop-blur-md"
          >
            <span className="grid size-4 place-items-center rounded-full border border-slate-500/30 bg-slate-100/70">
              <span className="size-2 rounded-full bg-slate-700 shadow-[0_0_0_2px_rgba(51,65,85,0.1)]" />
            </span>
            <span>{eyebrowText}</span>
          </motion.div>

          <motion.h1
            variants={contentItem}
            className="mt-5 max-w-5xl font-serif text-[clamp(3.25rem,4.8vw,5.35rem)] leading-[0.92] font-medium tracking-[-0.07em] text-balance whitespace-pre-line text-slate-700"
          >
            {title}
          </motion.h1>

          <motion.p
            variants={contentItem}
            className="mask-l-form-90% mask-r-form-90% mt-6 max-w-[570px] bg-white/5 mask-b-from-90% text-[clamp(1rem,1.35vw,1.16rem)] leading-[1.42] font-normal text-pretty whitespace-pre-line text-slate-900 backdrop-blur-[2px] sm:text-slate-700"
          >
            {description}
          </motion.p>

          <motion.a
            href={primaryHref}
            variants={contentItem}
            whileTap={{ scale: 0.96 }}
            className="text-md mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-linear-to-b from-blue-700 to-blue-900 px-5 font-normal text-white shadow-[0_1px_2px_rgba(15,23,42,0.18),0_12px_30px_rgba(15,23,42,0.08),inset_0_1px_0_0_var(--color-blue-600),inset_0_-1px_4px_0_var(--color-blue-600)] transition-[background-color,box-shadow,transform] duration-200 ease-out hover:bg-blue-800 hover:shadow-[0_2px_5px_rgba(15,23,42,0.2),0_16px_36px_rgba(15,23,42,0.1)]"
          >
            <span>{primaryText}</span>
            <FaArrowRight className="size-3" />
          </motion.a>
        </motion.div>

        <motion.div
          variants={contentContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="mb-0 flex flex-col items-center gap-4 sm:mb-7 sm:flex-row sm:items-end sm:justify-center"
        >
          <motion.div
            variants={contentItem}
            className="inline-flex w-fit items-center gap-3 rounded-full bg-white/14 p-px pr-4 text-sm font-semibold text-slate-800 shadow-[0_0px_1px_rgba(255,255,255,0.5)_inset] backdrop-blur-sm"
          >
            <span className="grid size-7 place-items-center rounded-full bg-slate-800 text-white outline -outline-offset-1 outline-white/10">
              <FaArrowRight className="size-3 -rotate-45" />
            </span>
            <span>{usersText}</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
