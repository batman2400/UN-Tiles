"use client";

import Link from "next/link";
import { Search, ShoppingCart, Menu, X, Shield } from "lucide-react";
import Image from "next/image";
import { AuthNavIcon } from "@/components/AuthNavIcon";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/collections", label: "Collections" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

// All pages with hero images where islands float transparently
const HERO_PAGES = ["/", "/about", "/contact", "/collections"];

export function TopNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { cartCount } = useCart();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isHeroPage = HERO_PAGES.includes(pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/collections?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  // Close mobile menu on route change
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    if (mobileOpen) setMobileOpen(false);
  }

  // Glassmorphism style for center & right pills
  const pillClass = scrolled
    ? "bg-white/80 backdrop-blur-2xl shadow-lg shadow-black/5 border border-white/30"
    : "bg-black/35 backdrop-blur-2xl border border-white/10";

  // Text colors
  const linkColor = scrolled
    ? "text-gray-700 hover:text-accent"
    : "text-white/90 hover:text-accent";

  const iconColor = scrolled
    ? "text-gray-600 hover:text-accent"
    : "text-white/85 hover:text-accent";

  return (
    <>
      {/* ── Split Island Navbar ── */}
      <div className="fixed top-0 w-full z-[100] pointer-events-none">
        <div className="max-w-[90rem] mx-auto px-6 lg:px-10 pt-5">
          <div className="flex items-center justify-between">

            {/* ═══ LEFT ISLAND — Brand Anchor (no container) ═══ */}
            <div className="pointer-events-auto flex-shrink-0">
              <Link href="/" className="block transition-transform duration-500 hover:scale-[1.03]">
                <Image
                  src="/images/final Logo without background.png"
                  alt="UN Tiles"
                  width={320}
                  height={110}
                  style={{ width: "auto", height: "72px" }}
                  className={`object-contain transition-all duration-500 drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)] hover:scale-[1.03]`}
                  priority
                />
              </Link>
            </div>

            {/* ═══ CENTER ISLAND — Directory Pill ═══ */}
            <nav
              className={`pointer-events-auto hidden md:flex items-center gap-8 rounded-full px-8 py-3 transition-all duration-500 ${pillClass}`}
            >
              {NAV_LINKS.map(({ href, label }) => {
                const isActive =
                  href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`text-xs font-bold tracking-[0.18em] uppercase transition-colors duration-300 ${
                      isActive ? "text-accent" : linkColor
                    }`}
                  >
                    {label.toUpperCase()}
                  </Link>
                );
              })}
            </nav>

            {/* ═══ RIGHT ISLAND — Utilities Pill ═══ */}
            <div
              className={`pointer-events-auto flex items-center gap-5 rounded-full px-6 py-3 transition-all duration-500 ${pillClass}`}
            >
              {/* Mobile menu trigger (replaces center nav on small screens) */}
              <button
                onClick={() => setMobileOpen(true)}
                className={`md:hidden transition-colors duration-300 ${iconColor}`}
              >
                <Menu className="w-[18px] h-[18px]" />
              </button>

              <form 
                onSubmit={handleSearchSubmit}
                className={`hidden md:flex items-center transition-all duration-500 overflow-hidden ${searchOpen ? 'w-40 border-b border-white/20' : 'w-0'}`}
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className={`bg-transparent outline-none text-xs w-full transition-colors ${scrolled ? 'text-gray-700 placeholder:text-gray-400' : 'text-white placeholder:text-white/50'}`}
                  onBlur={() => {
                    if (!searchQuery) setSearchOpen(false);
                  }}
                />
              </form>
              <button 
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                className={`hidden md:block transition-colors duration-300 ${iconColor}`}
              >
                <Search className="w-[18px] h-[18px]" />
              </button>

              {user?.role === "admin" && (
                <Link
                  href="/admin"
                  className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${iconColor}`}
                >
                  <Shield className="w-4 h-4" />
                  <span className="hidden lg:inline">Admin</span>
                </Link>
              )}

              <AuthNavIcon />

              <Link
                href="/cart"
                className={`relative transition-colors duration-300 ${iconColor}`}
              >
                <ShoppingCart className="w-[18px] h-[18px]" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 bg-accent text-on-accent text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* ── Mobile Drawer ── */}
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
            
            {/* Mobile Search Input */}
            <form onSubmit={handleSearchSubmit} className="p-4 border-b ghost-border">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant opacity-60" />
                <input
                  type="text"
                  placeholder="Search collections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low text-xs text-on-surface rounded-xl border ghost-border outline-none focus:border-accent"
                />
              </div>
            </form>
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
