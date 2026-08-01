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
    <div className="w-64 bg-white border-r border-gray-200 h-screen fixed top-0 left-0 flex flex-col shadow-sm">
      <div className="h-20 flex items-center px-6 border-b border-gray-100">
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

      <nav className="flex-1 py-8 px-4 space-y-2">
        <p className="px-3 text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
          Admin Panel
        </p>
        
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
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
