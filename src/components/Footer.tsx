"use client";

import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/collections", label: "Collections" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
  ];

  // Only show links that are NOT the current page
  const displayedLinks = navLinks.filter(link => link.href !== pathname);

  return (
    <footer className="relative flex w-full flex-col justify-between overflow-hidden bg-white text-stone-900 font-sans antialiased selection:bg-stone-900 selection:text-white border-t border-slate-200">
      {/* Main Content Container */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-between px-6 py-8 md:px-10 md:py-12 lg:py-16">
        
        {/* Top Section */}
        <div className="flex flex-col gap-10 md:flex-row md:justify-between mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-4"
          >
            {displayedLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className="text-2xl font-semibold tracking-tight transition-opacity hover:opacity-70 sm:text-3xl"
              >
                {link.label}
              </Link>
            ))}
          </motion.div>

          {/* Socials - Moved up */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-start justify-start md:justify-end pt-2"
          >
            <div className="flex w-full flex-wrap items-center justify-start gap-6 md:w-auto md:justify-end sm:gap-8 lg:gap-10">
              {[
                { label: "INSTAGRAM", href: "https://www.instagram.com/un_tiles_?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" },
                { label: "FACEBOOK", href: "https://www.facebook.com/unicornenterpriseslk/" },
                { label: "WHATSAPP", href: "https://wa.me/94773508325" },
                { label: "EMAIL", href: "mailto:fade16022025@gmail.com" },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 text-xs font-bold tracking-[0.15em] text-stone-500 transition-colors hover:text-stone-900 sm:text-sm"
                >
                  {social.label}
                  <HugeiconsIcon
                    icon={ArrowUpRight01Icon}
                    className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </a>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Section (Massive Logo) */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-auto mb-4 w-full"
        >
          {/* A large text logo representation for UN TILES */}
          <div className="flex w-full items-center justify-center overflow-hidden">
             <span className="text-[6vw] font-black tracking-tighter text-stone-900 leading-none">UN TILES</span>
          </div>
        </motion.div>

        {/* Footer Meta */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-start justify-between gap-4 text-stone-600 md:flex-row md:items-end"
        >
          <p className="max-w-3xl leading-relaxed">
            &copy; {new Date().getFullYear()} UN Tiles (Unicorn Enterprises). <br /> Architectural precision in high-end tiling. <br className="hidden lg:block" />
            Materializing your vision with structural integrity and timeless design.
          </p>
          <div className="flex items-center gap-8 whitespace-nowrap font-medium">
            <Link href="/terms" className="transition-colors hover:text-stone-900">Terms of Service</Link>
            <Link href="/privacy" className="transition-colors hover:text-stone-900">Privacy Policy</Link>
          </div>
        </motion.div>

      </div>
    </footer>
  );
}
