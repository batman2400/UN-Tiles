"use client";

import { useState, useMemo, useEffect } from "react";
import { CheckCircle, AlertTriangle, Package, Search, Image as ImageIcon, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import { AddCategoryModal } from "@/components/admin/AddCategoryModal";
import { AddProductModal } from "@/components/admin/AddProductModal";

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

export function InventoryTable({ initialProducts, categories }: { initialProducts: AdminProduct[], categories: { name: string, slug: string }[] }) {
  const supabase = useMemo(() => createClient(), []);

  const [products, setProducts] = useState<AdminProduct[]>(initialProducts);
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  // Subscribe to real-time inventory updates
  useEffect(() => {
    const channel = supabase
      .channel("admin-products-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "products" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          setProducts((prev) =>
            prev.map((p) =>
              p.id === payload.new.id ? { ...p, stock_sqft: payload.new.stock_sqft } : p
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

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
    <div className="animate-[page-enter_300ms_ease-out]">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Inventory Management</h2>
          <p className="text-sm text-gray-500 mt-1">Manage stock levels for all products.</p>
        </div>
        <div className="flex items-center gap-3">
          <AddCategoryModal />
          <AddProductModal categories={categories} />
        </div>
      </div>
      
      <div className="mb-6 relative max-w-md w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search SKU, name, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white shadow-sm text-sm text-gray-900 rounded-lg outline-none border border-gray-100 focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all"
        />
      </div>

      <div className="overflow-x-auto pb-8">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[25%] text-left">Product</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[15%] text-left">SKU</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[15%] text-left">Category</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[15%] text-right">Price</th>
              <th 
                className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[15%] text-right cursor-pointer hover:text-gray-900 transition-colors group"
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
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[15%] text-center">Restock</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <Package className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  No products found.
                </td>
              </tr>
            )}
            {filteredProducts.map((product, index) => {
              const row = getRowState(product.id);
              const delayClass = `motion-delay-${(index % 4) + 1}`;
              
              let dotColor = "bg-emerald-500 text-emerald-500";
              let statusText = "Healthy Stock";
              
              if (product.stock_sqft === 0) {
                dotColor = "bg-red-500 text-red-500";
                statusText = "Out of Stock";
              } else if (product.stock_sqft <= 50) {
                dotColor = "bg-amber-500 text-amber-500";
                statusText = "Low Stock";
              }

              return (
                <tr key={product.id} className={`group bg-white border-b border-gray-100 border-l-2 border-l-transparent hover:border-l-accent hover:bg-gray-50/80 transition-all motion-fade-up ${delayClass}`}>
                  <td className="px-6 py-3 text-left">
                    <div className="flex items-center gap-4">
                      <div className="relative w-9 h-9 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200/50">
                        {product.image ? (
                          <Image src={product.image} alt={product.name} fill className="object-cover" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <span className="font-semibold text-sm text-gray-900 group-hover:text-accent transition-colors">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-left">
                    <span className="font-mono text-xs text-gray-900">
                      {product.sku}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-left">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      {product.category_slug.replace(/-/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span className="font-mono text-sm font-medium text-gray-900">
                      Rs {product.price_per_sqft.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      <span className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${dotColor}`} title={statusText} />
                      <span className="text-lg font-mono font-bold text-gray-900 tracking-tight">
                        {product.stock_sqft.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-gray-200 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all shadow-sm">
                        <input
                          type="number"
                          min={0}
                          placeholder="New Stock"
                          value={row.editValue}
                          onChange={(e) => updateRowState(product.id, { editValue: e.target.value })}
                          className="w-20 text-center px-2 py-1 text-xs font-mono font-bold bg-transparent outline-none text-gray-900 placeholder:text-gray-400 placeholder:font-sans"
                        />
                        <button
                          onClick={() => handleUpdate(product)}
                          disabled={row.isUpdating || !row.editValue.trim()}
                          className="px-3 py-1 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-yellow-500 hover:text-black disabled:opacity-30 disabled:hover:bg-zinc-900 disabled:hover:text-white transition-all active:scale-95 flex items-center justify-center min-w-[40px]"
                        >
                          {row.isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                        </button>
                      </div>
                      
                      {/* Quick Increment Buttons */}
                      <div className="flex items-center gap-1">
                        {[50, 100].map((inc) => (
                          <button
                            key={inc}
                            onClick={() => {
                              const currentStock = product.stock_sqft || 0;
                              updateRowState(product.id, { editValue: String(currentStock + inc) });
                            }}
                            className="text-[9px] font-mono font-bold text-gray-500 hover:text-zinc-900 bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded transition-colors"
                          >
                            +{inc}
                          </button>
                        ))}
                      </div>
                      {row.feedback && (
                        <div className={`mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider motion-fade-up ${
                          row.feedback.type === 'success' 
                            ? 'bg-emerald-50 border-emerald-200/50 text-emerald-700' 
                            : 'bg-red-50 border-red-200/50 text-red-700'
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
