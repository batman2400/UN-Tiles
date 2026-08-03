'use client';

import Link from 'next/link';
import { LayoutDashboard, Package, Grid3x3, LogOut } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-display font-medium tracking-tight">UN Tiles Admin</h1>
          <p className="text-sm text-slate-400 mt-1 uppercase tracking-widest text-[10px]">Management Panel</p>
        </div>

        <nav className="mt-8 space-y-2 px-4">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-900/50 hover:text-blue-400 transition-colors"
          >
            <LayoutDashboard size={20} />
            <span className="font-medium text-sm">Dashboard</span>
          </Link>

          <Link
            href="/admin/products"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-900/50 hover:text-blue-400 transition-colors"
          >
            <Package size={20} />
            <span className="font-medium text-sm">Products</span>
          </Link>

          <Link
            href="/admin/categories"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-900/50 hover:text-blue-400 transition-colors"
          >
            <Grid3x3 size={20} />
            <span className="font-medium text-sm">Categories</span>
          </Link>
        </nav>

        <div className="absolute bottom-6 left-4 right-4">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-900/50 hover:text-blue-400 transition-colors w-full"
          >
            <LogOut size={20} />
            <span className="font-medium text-sm">Back to Store</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
