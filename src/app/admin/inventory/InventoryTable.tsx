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
    <div className="animate-[page-enter_300ms_ease-out]">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
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
            className="w-full pl-10 pr-4 py-2.5 bg-white shadow-sm text-sm text-gray-900 rounded-lg outline-none border border-gray-100 focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all"
          />
        </div>
      </div>

      <div className="overflow-x-auto pb-8">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Product</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">SKU</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Price</th>
              <th 
                className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right cursor-pointer hover:text-gray-900 transition-colors group"
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
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Restock</th>
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
            {filteredProducts.map((product) => {
              const row = getRowState(product.id);
              
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
                <tr key={product.id} className="group relative bg-white border-b border-gray-100 hover:bg-gray-50/80 transition-colors">
                  {/* Left Border Glow on Hover */}
                  <div className="absolute left-0 top-0 w-[2px] h-full bg-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <td className="px-6 py-3">
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
                  <td className="px-6 py-3">
                    <span className="font-mono text-xs text-gray-900">
                      {product.sku}
                    </span>
                  </td>
                  <td className="px-6 py-3">
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
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex items-center gap-1.5 p-1 bg-white rounded-lg border border-gray-200 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/50 transition-all shadow-sm">
                        <input
                          type="number"
                          min={0}
                          placeholder="Qty"
                          value={row.editValue}
                          onChange={(e) => updateRowState(product.id, { editValue: e.target.value })}
                          className="w-16 text-center px-1 py-1.5 text-sm font-mono bg-transparent outline-none text-gray-900 placeholder:text-gray-300"
                        />
                        <div className="overflow-hidden w-0 opacity-0 translate-x-2 group-hover:w-[48px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out">
                          <button
                            onClick={() => handleUpdate(product)}
                            disabled={row.isUpdating || !row.editValue.trim()}
                            className="w-12 py-1.5 flex justify-center items-center bg-accent text-white text-[10px] font-bold uppercase tracking-widest rounded-md hover:bg-accent/90 disabled:opacity-50 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed transition-all active:scale-95"
                          >
                            {row.isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Set"}
                          </button>
                        </div>
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
