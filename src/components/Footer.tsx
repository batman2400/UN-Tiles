"use client";

import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export function Footer() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/collections", label: "Collections" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
  ];

  const socialLinks = [
    { label: "INSTAGRAM", href: "https://www.instagram.com/un_tiles_?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" },
    { label: "FACEBOOK", href: "https://www.facebook.com/unicornenterpriseslk/" },
    { label: "WHATSAPP", href: "https://wa.me/94773508325" },
    { label: "EMAIL", href: "mailto:fade16022025@gmail.com" },
  ];

  const legalLinks = [
    { href: "/terms", label: "Terms of Service" },
    { href: "/privacy", label: "Privacy Policy" },
  ];

  // Only show links that are NOT the current page
  const displayedLinks = navLinks.filter((link) => link.href !== pathname);

  return (
    <footer className="w-full px-4 py-8 md:px-6 md:py-12 bg-background">
      <div className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[2.5rem] bg-primary before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-accent/60 before:to-transparent premium-shadow-lg">
        <div className="p-1.5">
          <div className="rounded-[2.25rem] bg-primary">
            <div className="flex min-h-[400px] flex-col justify-between px-8 pb-8 pt-12 md:px-12 md:pb-10 md:pt-16">
              {/* Top Grid Content */}
              <div className="mb-12 grid w-full grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
                {/* Brand & Description */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-start lg:col-span-5 xl:col-span-4"
                >
                  <div className="mb-6 flex items-center gap-3">
                    <span className="font-display text-3xl font-bold tracking-tight text-white">
                      UN TILES
                    </span>
                  </div>
                  <p className="mb-8 max-w-sm text-base leading-relaxed text-white/80">
                    Architectural precision in high-end tiling. Materializing your vision with structural integrity and timeless design.
                  </p>
                </motion.div>

                {/* Links & Socials Grid */}
                <div className="lg:col-span-7 lg:mt-2 xl:col-span-8">
                  <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 md:gap-8">
                    {/* Navigation */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                      className="flex flex-col gap-6"
                    >
                      <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                        Menu
                      </h4>
                      <ul className="flex flex-col gap-4">
                        {displayedLinks.map((link) => (
                          <li key={link.href}>
                            <Link
                              href={link.href}
                              className="text-lg font-medium text-white/80 transition-colors hover:text-white md:text-xl"
                            >
                              {link.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </motion.div>

                    {/* Socials */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="flex flex-col gap-6"
                    >
                      <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                        Connect
                      </h4>
                      <ul className="flex flex-col gap-4">
                        {socialLinks.map((social) => (
                          <li key={social.label}>
                            <a
                              href={social.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex items-center gap-2 text-sm font-bold tracking-[0.15em] text-white/80 transition-colors hover:text-accent"
                            >
                              {social.label}
                              <HugeiconsIcon
                                icon={ArrowUpRight01Icon}
                                className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                              />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Massive Logo at the bottom of the card */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="mt-auto flex w-full items-center justify-center overflow-hidden pointer-events-none select-none"
              >
                <span className="font-display text-[12vw] font-bold leading-none tracking-tighter text-white md:text-[9vw]">
                  UN TILES
                </span>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="border-t border-white/10 px-8 py-6 md:px-12">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm font-medium text-white/60">
              &copy; {new Date().getFullYear()} UN Tiles (Unicorn Enterprises).
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium text-white/60">
              {legalLinks.map((link, index) => (
                <React.Fragment key={index}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                  {index < legalLinks.length - 1 && (
                    <span className="h-4 w-px bg-white/20"></span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
