"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, Users, LogOut, ArrowLeft, Search, History, Menu, X } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/inventory", label: "Inventory", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/audit-log", label: "Audit Log", icon: History },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    if (mobileOpen) setMobileOpen(false);
  }

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

  const renderNav = () => (
    <>
      <div className="h-16 lg:h-20 flex items-center px-5 lg:px-6 border-b border-gray-100">
        <Link href="/" onClick={() => setMobileOpen(false)}>
          <Image
            src="/images/final Logo without background.png"
            alt="UN Tiles Admin"
            width={150}
            height={50}
            className="h-9 lg:h-10 w-auto object-contain"
          />
        </Link>
      </div>

      <nav className="flex-1 py-6 lg:py-8 px-4 space-y-2 overflow-y-auto">
        <p className="px-3 text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
          Admin Panel
        </p>

        <button
          onClick={() => {
            setMobileOpen(false);
            window.dispatchEvent(new CustomEvent("admin:open-command-palette"));
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 mb-2 rounded-lg text-sm font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors min-h-11"
        >
          <Search className="w-4 h-4" />
          <span className="flex-1 text-left">Search</span>
          <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-bold text-gray-400 bg-white rounded border border-gray-200">⌘K</kbd>
        </button>

        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors min-h-11 ${
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-gray-600 hover:bg-accent/5 hover:text-accent"
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100 space-y-2">
        <Link 
          href="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors min-h-11"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Store
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors min-h-11"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      <div className="lg:hidden flex items-center justify-between bg-white/90 backdrop-blur-xl border border-gray-200/60 rounded-2xl px-3 py-2.5 shadow-sm">
        <Link href="/">
          <Image
            src="/images/final Logo without background.png"
            alt="UN Tiles Admin"
            width={120}
            height={40}
            className="h-8 w-auto object-contain"
          />
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open admin menu"
          className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl text-gray-700 hover:bg-gray-100"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[200] lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute top-0 left-0 h-full w-[min(18rem,88vw)] bg-white shadow-2xl flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close admin menu"
              className="absolute top-3 right-3 min-h-11 min-w-11 inline-flex items-center justify-center text-gray-400 hover:text-gray-900"
            >
              <X className="w-5 h-5" />
            </button>
            {renderNav()}
          </div>
        </div>
      )}

      <div className="hidden lg:flex w-64 bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-2xl flex-col shadow-sm sticky top-4 h-[calc(100vh-2rem)] flex-shrink-0">
        {renderNav()}
      </div>
    </>
  );
}
