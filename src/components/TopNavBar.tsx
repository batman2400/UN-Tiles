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

  // Glassmorphism style for center & right pills
  const pillClass = scrolled
    ? "bg-white/80 backdrop-blur-md border border-zinc-200/80 shadow-sm"
    : "bg-black/35 backdrop-blur-md border border-white/10";

  const iconColor = scrolled
    ? "text-zinc-700 hover:text-black"
    : "text-white/85 hover:text-white";

  return (
    <>
      {/* ── Split Island Navbar ── */}
      <div className="fixed top-0 w-full z-[100] pointer-events-none pt-[env(safe-area-inset-top)]">
        <div className="max-w-[90rem] mx-auto px-3 sm:px-6 lg:px-10 pt-3 sm:pt-5">
          <div className="flex items-center justify-between gap-2">

            {/* ═══ LEFT ISLAND — Brand Anchor (no container) ═══ */}
            <div className="pointer-events-auto flex-shrink-0 min-w-0">
              <Link href="/" className="block transition-transform duration-500 hover:scale-[1.03]">
                <Image
                  src="/images/final Logo without background.png"
                  alt="UN Tiles"
                  width={320}
                  height={110}
                  className="h-11 w-auto sm:h-[72px] object-contain transition-all duration-500 drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)] hover:scale-[1.03]"
                  priority
                />
              </Link>
            </div>

            {/* ═══ CENTER ISLAND — Directory Pill ═══ */}
            <nav
              className={`pointer-events-auto hidden md:flex items-center gap-4 lg:gap-6 xl:gap-8 rounded-full px-5 lg:px-8 py-3 transition-all duration-500 absolute left-1/2 -translate-x-1/2 ${pillClass}`}
            >
              {NAV_LINKS.map(({ href, label, badge }) => {
                const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
                let currentLinkColor;
                if (isActive) {
                  currentLinkColor = scrolled ? "text-black font-bold" : "text-white font-bold";
                } else {
                  currentLinkColor = scrolled ? "text-zinc-700 hover:text-black font-medium" : "text-white/80 hover:text-white font-medium";
                }

                return (
                  <Link
                    key={href}
                    href={href}
                    className={`text-xs tracking-[0.18em] uppercase transition-colors duration-300 flex items-center gap-1.5 ${currentLinkColor}`}
                  >
                    <span>{label.toUpperCase()}</span>
                    {badge && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-400/40">
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* ═══ RIGHT ISLAND — Utilities Pill ═══ */}
            <div
              className={`pointer-events-auto flex items-center gap-1.5 sm:gap-5 rounded-full px-1.5 sm:px-6 py-1 sm:py-3 transition-all duration-500 flex-shrink-0 ${pillClass}`}
            >
              {/* Mobile menu trigger (replaces center nav on small screens) */}
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                className={`md:hidden h-10 w-10 inline-flex items-center justify-center transition-colors duration-300 ${iconColor}`}
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
                aria-label="Search"
                className={`hidden md:inline-flex h-10 w-10 sm:min-h-11 sm:min-w-11 items-center justify-center transition-colors duration-300 ${iconColor}`}
              >
                <Search className="w-[18px] h-[18px]" />
              </button>

              {user?.role === "admin" && (
                <Link
                  href="/admin"
                  className={`hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${iconColor}`}
                >
                  <Shield className="w-4 h-4" />
                  <span className="hidden lg:inline">Admin</span>
                </Link>
              )}

              <div className="hidden sm:block">
                <AuthNavIcon className={iconColor} />
              </div>

              <Link
                href="/cart"
                aria-label="Cart"
                className={`relative hidden sm:inline-flex h-10 w-10 sm:min-h-11 sm:min-w-11 items-center justify-center transition-colors duration-300 ${iconColor}`}
              >
                <ShoppingCart className="w-[18px] h-[18px]" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-0.5 bg-accent text-on-accent text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[110] md:hidden">
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
