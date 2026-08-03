'use client';

import { useEffect, useState } from 'react';
import { Package, Grid3x3, BarChart3, TrendingUp } from 'lucide-react';

interface Stats {
  totalProducts: number;
  totalCategories: number;
  totalStock: number;
  totalValue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalCategories: 0,
    totalStock: 0,
    totalValue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const StatCard = ({ icon: Icon, label, value }: any) => (
    <div className="bg-white rounded-lg shadow p-6 flex items-start gap-4">
      <div className="bg-blue-100 p-3 rounded-lg">
        <Icon className="text-blue-600" size={24} />
      </div>
      <div>
        <p className="text-gray-600 text-sm">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">
          {loading ? '—' : value}
        </p>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-medium tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-2">Welcome to UN Tiles Admin Panel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Package}
          label="Total Products"
          value={stats.totalProducts}
        />
        <StatCard
          icon={Grid3x3}
          label="Categories"
          value={stats.totalCategories}
        />
        <StatCard
          icon={BarChart3}
          label="Stock (sq ft)"
          value={stats.totalStock.toLocaleString()}
        />
        <StatCard
          icon={TrendingUp}
          label="Inventory Value"
          value={`$${stats.totalValue.toLocaleString()}`}
        />
      </div>

      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-display font-medium text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/products/new"
            className="px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-semibold tracking-wide uppercase text-xs text-center"
          >
            + Add New Product
          </a>
          <a
            href="/admin/categories"
            className="px-4 py-3 bg-blue-50 text-blue-900 border border-blue-100 rounded hover:bg-blue-100 transition-colors font-semibold tracking-wide uppercase text-xs text-center"
          >
            Manage Categories
          </a>
          <a
            href="/admin/products"
            className="px-4 py-3 bg-blue-50 text-blue-900 border border-blue-100 rounded hover:bg-blue-100 transition-colors font-semibold tracking-wide uppercase text-xs text-center"
          >
            View All Products
          </a>
        </div>
      </div>
    </div>
  );
}
