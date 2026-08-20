"use client";

import Link from "next/link";
import { Search, ShoppingCart, Menu, X, Shield, LogOut } from "lucide-react";
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
  { href: "/visual-search", label: "Visual Match", badge: "AI" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];


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

  // Close mobile menu on route change
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    if (mobileOpen) setMobileOpen(false);
  }

  // Unified glassmorphism pill style
  const pillClass = scrolled
    ? "bg-white/95 backdrop-blur-xl border border-zinc-200/90 shadow-xl shadow-black/5"
    : "bg-white/85 backdrop-blur-xl border border-white/60 shadow-lg shadow-black/5";

  const iconColor = "text-zinc-700 hover:text-black";

  return (
    <>
      {/* ── Unified Floating Glass Capsule Navbar ── */}
      <header className="fixed top-0 left-0 w-full z-[100] pointer-events-none pt-[env(safe-area-inset-top)] px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4">
        <div className="max-w-7xl mx-auto">
          <div
            className={`pointer-events-auto h-14 sm:h-16 px-3.5 sm:px-6 rounded-full flex items-center justify-between transition-all duration-500 ${pillClass}`}
          >
            {/* ═══ 1. BRAND LOGO ═══ */}
            <div className="flex items-center flex-shrink-0">
              <Link
                href="/"
                className="flex items-center transition-transform duration-300 hover:scale-105"
              >
                <Image
                  src="/images/final Logo without background.png"
                  alt="UN Tiles"
                  width={240}
                  height={80}
                  className="h-8 sm:h-10 w-auto object-contain drop-shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
                  priority
                />
              </Link>
            </div>

            {/* ═══ 2. DIRECTORY NAVIGATION (Desktop) ═══ */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              {NAV_LINKS.map(({ href, label, badge }) => {
                const isActive =
                  href === "/" ? pathname === "/" : pathname.startsWith(href);

                return (
                  <Link
                    key={href}
                    href={href}
                    className={`px-3 xl:px-4 py-2 rounded-full text-xs xl:text-[13px] tracking-wider uppercase transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
                      isActive
                        ? "text-black font-bold bg-zinc-900/10 shadow-inner"
                        : "text-zinc-600 hover:text-black hover:bg-zinc-900/5 font-medium"
                    }`}
                  >
                    <span>{label}</span>
                    {badge && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 font-bold border border-amber-500/30">
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* ═══ 3. UTILITIES & ACTIONS ═══ */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Expandable Search */}
              <form
                onSubmit={handleSearchSubmit}
                className={`hidden sm:flex items-center transition-all duration-300 overflow-hidden ${
                  searchOpen
                    ? "w-32 sm:w-44 bg-zinc-100/90 rounded-full px-3 py-1 border border-zinc-200 mr-1"
                    : "w-0"
                }`}
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search catalog..."
                  className="bg-transparent outline-none text-xs text-zinc-800 placeholder:text-zinc-400 w-full"
                  onBlur={() => {
                    if (!searchQuery) setSearchOpen(false);
                  }}
                />
              </form>

              <button
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Search"
                className={`h-9 w-9 sm:h-10 sm:w-10 rounded-full inline-flex items-center justify-center hover:bg-zinc-100 transition-colors ${iconColor}`}
              >
                <Search className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              </button>

              {/* Admin Link */}
              {user?.role === "admin" && (
                <Link
                  href="/admin"
                  className={`hidden sm:flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full hover:bg-zinc-100 transition-colors ${iconColor}`}
                >
                  <Shield className="w-3.5 h-3.5 text-accent" />
                  <span className="hidden xl:inline">Admin</span>
                </Link>
              )}

              {/* Profile / Account Icon */}
              <div className="flex items-center">
                <AuthNavIcon className={iconColor} />
              </div>

              {/* Cart Icon */}
              <Link
                href="/cart"
                aria-label="Cart"
                className={`relative h-9 w-9 sm:h-10 sm:w-10 rounded-full inline-flex items-center justify-center hover:bg-zinc-100 transition-colors ${iconColor}`}
              >
                <ShoppingCart className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                {cartCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-accent text-on-accent text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Mobile / Tablet Menu Button */}
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                className={`lg:hidden h-9 w-9 sm:h-10 sm:w-10 rounded-full inline-flex items-center justify-center hover:bg-zinc-100 transition-colors ${iconColor}`}
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile & Tablet Drawer ── */}
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
              className="absolute top-0 right-0 h-full w-[min(22rem,88vw)] bg-surface-container-lowest shadow-2xl flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
            >
              <div className="flex items-center justify-between p-5 sm:p-6 border-b ghost-border">
                <Image
                  src="/images/final Logo without background.png"
                  alt="UN Tiles"
                  width={200}
                  height={70}
                  className="h-9 sm:h-10 w-auto object-contain"
                />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="min-h-10 min-w-10 inline-flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors rounded-full hover:bg-surface-container"
                >
                  <X className="w-5 h-5" />
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
                        ? "text-accent bg-accent-soft"
                        : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
                    }`}
                  >
                    <span>{label}</span>
                    {badge && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-400/40">
                        {badge}
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
                    ? "text-accent bg-accent-soft"
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
                    ? "text-accent bg-accent-soft"
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
