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
const HERO_PAGES = ["/", "/about", "/contact"];

export function TopNavBar() {
  const pathname = usePathname();
  const { cartCount } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isHeroPage = HERO_PAGES.includes(pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll(); // initialize
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change (React pattern: adjusting state on prop change)
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    if (mobileOpen) setMobileOpen(false);
  }

  const navbarClass = isHeroPage && !scrolled ? "navbar-transparent" : "navbar-solid";

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-500 ${navbarClass}`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Mobile menu icon */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden nav-icon icon-button-lift transition-colors duration-300"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center motion-fade-up">
            <Image
              src="/images/Logo.png"
              alt="UN Tiles"
              width={120}
              height={40}
              style={{ width: "auto", height: "auto", maxHeight: "44px" }}
              className="object-contain logo-edge-blend transition-transform duration-500 hover:scale-[1.03]"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex flex-1 justify-center gap-10">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative kinetic-link nav-link text-sm tracking-widest uppercase font-semibold transition-colors duration-300 ${
                    isActive ? "nav-link-active" : ""
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-6">
            <button className="nav-icon icon-button-lift transition-colors duration-300">
              <Search className="w-5 h-5" />
            </button>
            <AuthNavIcon />
            <Link href="/cart" className="relative nav-icon icon-button-lift transition-colors duration-300">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-accent text-on-accent text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

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
                src="/images/Logo.png"
                alt="UN Tiles"
                width={100}
                height={32}
                style={{ width: "auto", height: "auto", maxHeight: "36px" }}
                className="object-contain logo-edge-blend"
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
