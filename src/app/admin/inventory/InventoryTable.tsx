"use client";

import { useState, useMemo } from "react";
import { CheckCircle, AlertTriangle, Package, Search, Image as ImageIcon, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";

export interface AdminProduct {
  id: string;
  sku: string;
  name: string;
  stock_sqft: number;
  price_per_sqft: number;
  category_slug: string;
  image: string;
}

interface RowState {
  editValue: string;
  isUpdating: boolean;
  feedback: { type: "success" | "error"; message: string } | null;
}

export function InventoryTable({ initialProducts }: { initialProducts: AdminProduct[] }) {
  const supabase = useMemo(() => createClient(), []);

  const [products, setProducts] = useState<AdminProduct[]>(initialProducts);
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category_slug.toLowerCase().includes(q)
      );
    }

    if (sortConfig !== null) {
      result.sort((a, b) => {
        if (sortConfig.key === 'stock_sqft') {
          return sortConfig.direction === 'asc' 
            ? a.stock_sqft - b.stock_sqft 
            : b.stock_sqft - a.stock_sqft;
        }
        return 0;
      });
    }
    
    // We return a new array to trigger re-renders properly after sort
    return [...result];
  }, [products, searchQuery, sortConfig]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getRowState = (id: string): RowState => {
    return (
      rowStates[id] ?? {
        editValue: "",
        isUpdating: false,
        feedback: null,
      }
    );
  };

  const updateRowState = (id: string, patch: Partial<RowState>) => {
    setRowStates((prev) => ({
      ...prev,
      [id]: { ...getRowState(id), ...patch },
    }));
  };

  const handleUpdate = async (product: AdminProduct) => {
    const row = getRowState(product.id);
    const newStock = parseFloat(row.editValue);

    if (isNaN(newStock) || newStock < 0) {
      updateRowState(product.id, {
        feedback: { type: "error", message: "Invalid positive number." },
      });
      return;
    }

    updateRowState(product.id, { isUpdating: true, feedback: null });

    const { error } = await supabase
      .from("products")
      .update({ stock_sqft: newStock })
      .eq("id", product.id);

    if (error) {
      updateRowState(product.id, {
        isUpdating: false,
        feedback: { type: "error", message: error.message },
      });
      return;
    }

    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, stock_sqft: newStock } : p))
    );

    updateRowState(product.id, {
      isUpdating: false,
      editValue: "",
      feedback: { type: "success", message: "Stock updated!" },
    });

    setTimeout(() => {
      updateRowState(product.id, { feedback: null });
    }, 3000);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden animate-[page-enter_300ms_ease-out]">
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Inventory Management</h2>
          <p className="text-sm text-gray-500 mt-1">Manage stock levels for all products.</p>
        </div>
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search SKU, name, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 text-sm text-gray-900 rounded-lg outline-none border border-gray-200 focus:border-gray-400 transition-colors"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">SKU</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Price</th>
              <th 
                className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right cursor-pointer hover:bg-gray-100 transition-colors group"
                onClick={() => handleSort('stock_sqft')}
              >
                <div className="flex items-center justify-end gap-1">
                  Stock (sq ft)
                  {sortConfig?.key === 'stock_sqft' ? (
                    sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-gray-900" /> : <ArrowDown className="w-3 h-3 text-gray-900" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Restock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  <Package className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  No products found.
                </td>
              </tr>
            )}
            {filteredProducts.map((product) => {
              const row = getRowState(product.id);
              
              let stockColor = "text-green-600";
              let badgeBg = "bg-emerald-50 border-emerald-200/60";
              let badgeText = "text-emerald-700";
              let statusText = "Healthy Stock";
              
              if (product.stock_sqft === 0) {
                stockColor = "text-red-600";
                badgeBg = "bg-red-50 border-red-200/60";
                badgeText = "text-red-700";
                statusText = "Out of Stock";
              } else if (product.stock_sqft <= 50) {
                stockColor = "text-amber-600";
                badgeBg = "bg-amber-50 border-amber-200/60";
                badgeText = "text-amber-700";
                statusText = "Low Stock";
              }

              return (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {product.image ? (
                          <Image src={product.image} alt={product.name} fill className="object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <span className="font-semibold text-sm text-gray-900">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {product.sku}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      {product.category_slug.replace(/-/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-medium text-gray-900">
                      Rs {product.price_per_sqft.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`text-sm font-bold ${stockColor}`}>
                        {product.stock_sqft.toLocaleString()}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeBg} ${badgeText}`}>
                        {statusText}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          placeholder="Qty"
                          value={row.editValue}
                          onChange={(e) => updateRowState(product.id, { editValue: e.target.value })}
                          className="w-20 text-center px-2 py-1.5 text-sm bg-white border border-gray-300 rounded-md outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-all"
                        />
                        <button
                          onClick={() => handleUpdate(product)}
                          disabled={row.isUpdating || !row.editValue.trim()}
                          className="px-4 py-1.5 min-w-[60px] flex justify-center bg-accent text-white text-xs font-bold uppercase tracking-wider rounded-md hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {row.isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Set"}
                        </button>
                      </div>
                      {row.feedback && (
                        <div className={`mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider motion-fade-up ${
                          row.feedback.type === 'success' 
                            ? 'bg-green-50 border-green-200 text-green-700' 
                            : 'bg-red-50 border-red-200 text-red-700'
                        }`}>
                          {row.feedback.type === 'success' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          {row.feedback.message}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
