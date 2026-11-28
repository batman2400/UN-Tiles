"use client";

import Link from "next/link";
import { Search, ShoppingCart, Menu, X, Shield, LogOut } from "lucide-react";
import { AiFeatureIcon } from "@/components/ui/AiFeatureIcon";
import Image from "next/image";
import { AuthNavIcon } from "@/components/AuthNavIcon";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "motion/react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/collections", label: "Collections" },
  { href: "/planner", label: "Planner" },
  { href: "/visual-search", label: "AI Tile Finder", badge: "AI" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

// Routes whose hero background at scrollY = 0 has a dark top scrim behind white nav items
const DARK_HERO_PATHS = new Set(["/collections", "/planner", "/about", "/contact"]);

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
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    searchInputRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    const onPointer = (e: MouseEvent) => {
      if (!searchWrapperRef.current?.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [searchOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/collections?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setMobileOpen(false);
      setSearchQuery("");
    }
  };

  // Close mobile menu & search popover on route change
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    if (mobileOpen) setMobileOpen(false);
    if (searchOpen) setSearchOpen(false);
  }

  const useLightPill = scrolled || !DARK_HERO_PATHS.has(pathname);

  const pillClass = useLightPill
    ? "bg-white/90 backdrop-blur-md border border-zinc-200/80 shadow-sm"
    : "bg-black/45 backdrop-blur-md border border-white/15 shadow-md";

  const iconColor = useLightPill
    ? "text-zinc-700 hover:text-black hover:bg-zinc-900/5"
    : "text-white/90 hover:text-white hover:bg-white/10";

  const badgeClass = useLightPill
    ? "bg-amber-500/15 text-amber-800 border border-amber-500/35"
    : "bg-amber-500/20 text-amber-200 border border-amber-400/40";

  return (
    <>
      {/* ── Split Island Navbar ── */}
      <div className="fixed top-0 w-full z-[100] pointer-events-none pt-[env(safe-area-inset-top)]">
        <div className="max-w-[92rem] mx-auto px-3 sm:px-5 lg:px-6 pt-3 sm:pt-4">
          <div className="flex items-center justify-between gap-2 relative">

            {/* ═══ LEFT ISLAND — Brand Anchor ═══ */}
            <div className="pointer-events-auto flex-shrink-0 min-w-0">
              <Link
                href="/"
                className="inline-flex items-center rounded-full px-1.5 py-0.5 transition-transform duration-500 hover:scale-[1.03]"
              >
                <Image
                  src="/images/final Logo without background.png"
                  alt="UN Tiles"
                  width={320}
                  height={110}
                  className="h-10 sm:h-11 lg:h-12 w-auto object-contain transition-all duration-500 drop-shadow-[0_2px_10px_rgba(255,255,255,0.65)]"
                  priority
                />
              </Link>
            </div>

            {/* ═══ CENTER ISLAND — Directory Pill ═══ */}
            <nav
              aria-label="Primary navigation"
              className={`pointer-events-auto hidden lg:flex items-center gap-4 xl:gap-6 2xl:gap-7 rounded-full h-11 sm:h-12 px-6 xl:px-7 transition-all duration-500 absolute left-1/2 -translate-x-1/2 ${pillClass}`}
            >
              {NAV_LINKS.map(({ href, label, badge }) => {
                const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
                let currentLinkColor: string;
                if (isActive) {
                  currentLinkColor = useLightPill ? "text-black font-bold" : "text-white font-bold";
                } else {
                  currentLinkColor = useLightPill
                    ? "text-zinc-700 hover:text-black font-semibold"
                    : "text-white/90 hover:text-white font-medium";
                }

                return (
                  <Link
                    key={href}
                    href={href}
                    className={`text-xs xl:text-[12.5px] tracking-[0.14em] uppercase transition-colors duration-300 flex items-center gap-1.5 whitespace-nowrap ${currentLinkColor}`}
                  >
                    <span>{label.toUpperCase()}</span>
                    {badge && (
                      <span className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold leading-none ${badgeClass}`}>
                        <AiFeatureIcon className="w-2.5 h-2.5 shrink-0" />
                        <span>{badge}</span>
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* ═══ RIGHT ISLAND — Utilities Pill ═══ */}
            <div ref={searchWrapperRef} className="pointer-events-auto relative flex-shrink-0">
              <div
                className={`flex items-center gap-1 sm:gap-2 xl:gap-2.5 rounded-full h-11 sm:h-12 px-2.5 sm:px-3.5 transition-all duration-500 ${pillClass}`}
              >
                {/* Search Popover Toggle */}
                <button
                  type="button"
                  onClick={() => setSearchOpen((v) => !v)}
                  aria-label="Search tiles"
                  aria-expanded={searchOpen}
                  className={`hidden md:inline-flex h-9 w-9 items-center justify-center transition-colors duration-300 rounded-full ${iconColor}`}
                >
                  <Search className="w-[18px] h-[18px]" />
                </button>

                {/* Admin Link */}
                {user?.role === "admin" && (
                  <Link
                    href="/admin"
                    title="Admin Dashboard"
                    className={`hidden sm:inline-flex items-center gap-1.5 h-9 text-[10px] font-black uppercase tracking-widest transition-colors duration-300 px-2.5 rounded-full ${iconColor}`}
                  >
                    <Shield className="w-3.5 h-3.5 text-amber-500" />
                    <span className="hidden 2xl:inline">Admin</span>
                  </Link>
                )}

                {/* User Avatar */}
                <div className="hidden sm:flex items-center">
                  <AuthNavIcon className={iconColor} />
                </div>

                {/* Cart Icon (Visible on all screens including Mobile) */}
                <Link
                  href="/cart"
                  aria-label="Cart"
                  className={`relative inline-flex h-9 w-9 items-center justify-center transition-colors duration-300 rounded-full ${iconColor}`}
                >
                  <ShoppingCart className="w-[18px] h-[18px]" />
                  {cartCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 bg-accent text-on-accent text-[9px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center shadow-sm">
                      {cartCount}
                    </span>
                  )}
                </Link>

                {/* Mobile menu trigger */}
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open menu"
                  className={`lg:hidden h-9 w-9 inline-flex items-center justify-center transition-colors duration-300 rounded-full ${iconColor}`}
                >
                  <Menu className="w-[18px] h-[18px]" />
                </button>
              </div>

              {/* Anchored Desktop Search Popover (avoids center-nav overlap) */}
              {searchOpen && (
                <form
                  onSubmit={handleSearchSubmit}
                  className="hidden md:flex items-center gap-2 absolute right-0 top-full mt-2.5 w-72 sm:w-80 rounded-2xl bg-white/95 backdrop-blur-xl border border-zinc-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <Search className="w-4 h-4 text-zinc-400 ml-2 shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tiles, finish, size..."
                    className="flex-1 bg-transparent outline-none text-xs font-medium text-zinc-900 placeholder:text-zinc-400 py-1.5"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-zinc-900 text-white hover:bg-accent text-[11px] font-semibold uppercase tracking-wider transition-colors shrink-0"
                  >
                    Go
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[110] lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 h-full w-[min(20rem,88vw)] bg-surface-container-lowest shadow-2xl flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
            >
              <div className="flex items-center justify-between p-5 sm:p-6 border-b ghost-border">
                <Image
                  src="/images/final Logo without background.png"
                  alt="UN Tiles"
                  width={200}
                  height={70}
                  className="h-10 w-auto object-contain"
                />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="min-h-11 min-w-11 inline-flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
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
                    className="w-full pl-9 pr-4 py-3 bg-surface-container-low text-sm text-on-surface rounded-xl border ghost-border outline-none focus:border-accent"
                  />
                </div>
              </form>
              <nav className="flex-1 p-4 sm:p-6 space-y-1 overflow-y-auto">
                {NAV_LINKS.map(({ href, label, badge }) => {
                  const isActive =
                    href === "/" ? pathname === "/" : pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between py-3.5 px-4 text-sm tracking-widest uppercase font-semibold rounded-xl transition-colors ${
                        isActive
                          ? "text-amber-800 bg-accent-soft"
                          : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
                      }`}
                    >
                      <span>{label}</span>
                      {badge && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 font-bold border border-amber-500/35">
                          <AiFeatureIcon className="w-3 h-3 shrink-0" />
                          <span>{badge}</span>
                        </span>
                      )}
                    </Link>
                  );
                })}
                <Link
                  href="/cart"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between py-3.5 px-4 text-sm tracking-widest uppercase font-semibold rounded-xl transition-colors ${
                    pathname.startsWith("/cart")
                      ? "text-amber-800 bg-accent-soft"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
                  }`}
                >
                  <span>Cart</span>
                  {cartCount > 0 && (
                    <span className="bg-accent text-on-accent text-[10px] font-bold h-5 min-w-5 px-1.5 rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
                <Link
                  href={user ? "/profile" : "/login"}
                  onClick={() => setMobileOpen(false)}
                  className={`block py-3.5 px-4 text-sm tracking-widest uppercase font-semibold rounded-xl transition-colors ${
                    pathname.startsWith("/profile") || pathname.startsWith("/login")
                      ? "text-amber-800 bg-accent-soft"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
                  }`}
                >
                  {user ? "Account" : "Sign In"}
                </Link>
                {user?.role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 py-3.5 px-4 text-sm tracking-widest uppercase font-semibold rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
                  >
                    <Shield className="w-4 h-4" />
                    Admin
                  </Link>
                )}
              </nav>
              <div className="p-5 sm:p-6 border-t ghost-border flex flex-col gap-4">
                {user && (
                  <button
                    onClick={async () => {
                      const supabase = createClient();
                      await supabase.auth.signOut();
                      window.location.href = "/login";
                    }}
                    className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                )}
                <p className="text-xs text-on-surface-variant">
                  © {new Date().getFullYear()} UN Tiles
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
