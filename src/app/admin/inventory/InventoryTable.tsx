"use client";

import { useState, useMemo } from "react";
import { CheckCircle, AlertTriangle, Package, Search, Image as ImageIcon } from "lucide-react";
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

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category_slug.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-[page-enter_300ms_ease-out]">
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
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Stock (sq ft)</th>
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
              const isLowStock = product.stock_sqft < 100;

              return (
                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-12 h-12 rounded bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
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
                    <div className="flex flex-col items-end">
                      <span className={`text-sm font-bold ${isLowStock ? "text-red-600" : "text-gray-900"}`}>
                        {product.stock_sqft.toLocaleString()}
                      </span>
                      {isLowStock && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Low Stock
                        </span>
                      )}
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
                          className="px-4 py-1.5 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {row.isUpdating ? "..." : "Set"}
                        </button>
                      </div>
                      {row.feedback && (
                        <span className={`text-[10px] font-bold uppercase tracking-wider mt-2 ${row.feedback.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                          {row.feedback.message}
                        </span>
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
