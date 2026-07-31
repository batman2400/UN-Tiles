"use client";

import Link from "next/link";
import { Search, ShoppingCart, Menu, X } from "lucide-react";
import Image from "next/image";
import { AuthNavIcon } from "@/components/AuthNavIcon";
import { useCart } from "@/context/CartContext";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/collections", label: "Collections" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

// Pages where navbar starts transparent over a hero image
const HERO_PAGES = ["/", "/about", "/contact", "/collections"];

export function TopNavBar() {
  const pathname = usePathname();
  const { cartCount } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isHeroPage = HERO_PAGES.includes(pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    if (mobileOpen) setMobileOpen(false);
  }

  return (
    <>
      {/* ── Floating Pill Navbar ── */}
      <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 transition-all duration-500">
        <nav
          className={`w-full max-w-6xl rounded-full px-8 py-3 flex items-center justify-between transition-all duration-500 ${
            scrolled
              ? "bg-white/85 backdrop-blur-xl shadow-lg border border-white/20"
              : "bg-black/40 backdrop-blur-xl border border-white/10"
          }`}
        >
          {/* Left: Mobile menu + Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-white/90 hover:text-accent transition-colors duration-300"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/" className="flex-shrink-0 flex items-center">
              <Image
                src="/images/final Logo without background.png"
                alt="UN Tiles Logo"
                width={200}
                height={60}
                style={{ width: "auto", height: "44px" }}
                className={`object-contain transition-all duration-500 hover:scale-[1.03] ${
                  scrolled ? "" : "brightness-0 invert"
                }`}
              />
            </Link>
          </div>

          {/* Center: Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-2 py-1 text-xs font-bold tracking-[0.15em] uppercase transition-colors duration-300 border-b-2 ${
                    isActive
                      ? scrolled
                        ? "text-accent border-accent"
                        : "text-accent border-accent"
                      : scrolled
                      ? "text-gray-700 hover:text-accent border-transparent hover:border-accent/50"
                      : "text-white/90 hover:text-accent border-transparent hover:border-accent/50"
                  }`}
                >
                  {label.toUpperCase()}
                </Link>
              );
            })}
          </div>

          {/* Right: Search, Profile, Cart */}
          <div className="flex items-center space-x-5">
            <button
              className={`transition-colors duration-300 ${
                scrolled
                  ? "text-gray-600 hover:text-accent"
                  : "text-white/85 hover:text-accent"
              }`}
            >
              <Search className="w-[18px] h-[18px]" />
            </button>
            <AuthNavIcon />
            <Link
              href="/cart"
              className={`relative transition-colors duration-300 ${
                scrolled
                  ? "text-gray-600 hover:text-accent"
                  : "text-white/85 hover:text-accent"
              }`}
            >
              <ShoppingCart className="w-[18px] h-[18px]" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-accent text-on-accent text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </nav>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute top-0 left-0 h-full w-80 max-w-[85vw] bg-surface-container-lowest shadow-2xl flex flex-col animate-[page-enter_300ms_ease-out]">
            <div className="flex items-center justify-between p-6 border-b ghost-border">
              <Image
                src="/images/final Logo without background.png"
                alt="UN Tiles"
                width={200}
                height={70}
                style={{ width: "auto", height: "50px" }}
                className="object-contain"
              />
              <button
                onClick={() => setMobileOpen(false)}
                className="text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex-1 p-6 space-y-2">
              {NAV_LINKS.map(({ href, label }) => {
                const isActive =
                  href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`block py-3 px-4 text-sm tracking-widest uppercase font-semibold transition-colors ${
                      isActive
                        ? "text-accent bg-accent-soft"
                        : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
            <div className="p-6 border-t ghost-border">
              <p className="text-xs text-on-surface-variant">
                © {new Date().getFullYear()} UN Tiles
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
