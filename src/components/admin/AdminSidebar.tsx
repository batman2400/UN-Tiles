"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, LogOut, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/inventory", label: "Inventory", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="w-64 bg-white/60 backdrop-blur-2xl border border-white/50 rounded-2xl flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.03)] sticky top-4 h-[calc(100vh-2rem)] flex-shrink-0 overflow-hidden relative">
      {/* Subtle shine/reflection effect for the glass panel */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
      
      <div className="h-20 flex items-center px-6 border-b border-gray-200/40 relative z-10">
        <Link href="/">
          <Image
            src="/images/final Logo without background.png"
            alt="UN Tiles Admin"
            width={150}
            height={50}
            style={{ width: "auto", height: "40px" }}
            className="object-contain"
          />
        </Link>
      </div>

      <nav className="flex-1 py-8 px-4 space-y-2 relative z-10">
        <p className="px-3 text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">
          Admin Panel
        </p>
        
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 relative overflow-hidden ${
                isActive
                  ? "text-accent shadow-sm"
                  : "text-gray-600 hover:text-accent hover:translate-x-1"
              }`}
            >
              {/* Fluid hover/active background */}
              <div className={`absolute inset-0 transition-opacity duration-300 ${
                isActive ? "opacity-100 bg-gradient-to-r from-accent/15 to-transparent" : "opacity-0 bg-gradient-to-r from-accent/5 to-transparent group-hover:opacity-100"
              }`} />
              
              <Icon className="w-5 h-5 relative z-10" />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100 space-y-2">
        <Link 
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Store
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
