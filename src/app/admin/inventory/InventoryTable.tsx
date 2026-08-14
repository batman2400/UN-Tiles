"use client";

import { useState, useMemo, useEffect } from "react";
import { CheckCircle, AlertTriangle, Package, Search, Image as ImageIcon, Loader2, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Download, Trash2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import { AddCategoryModal } from "@/components/admin/AddCategoryModal";
import { AddProductModal } from "@/components/admin/AddProductModal";
import { downloadCsv } from "@/lib/csv";
import { adjustProductStock, bulkAdjustProductStock, deleteProduct } from "@/app/actions/admin";

const PAGE_SIZE = 10;
type SortKey = "name" | "sku" | "category_slug" | "price_per_sqft" | "stock_sqft";

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

export function InventoryTable({
  initialProducts,
  categories,
}: {
  initialProducts: AdminProduct[];
  categories: { name: string, slug: string }[];
}) {
  const supabase = useMemo(() => createClient(), []);

  const [products, setProducts] = useState<AdminProduct[]>(initialProducts);
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkRestockAmount, setBulkRestockAmount] = useState("");
  const [isBulkRestocking, setIsBulkRestocking] = useState(false);

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
    // Always work off a fresh copy — never mutate the `products` state array in place.
    let result = [...products];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category_slug.toLowerCase().includes(q)
      );
    }

    if (sortConfig !== null) {
      const { key, direction } = sortConfig;
      const dir = direction === 'asc' ? 1 : -1;
      result.sort((a, b) => {
        if (key === 'price_per_sqft' || key === 'stock_sqft') {
          return (a[key] - b[key]) * dir;
        }
        return a[key].localeCompare(b[key]) * dir;
      });
    }

    return result;
  }, [products, searchQuery, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, currentPage]);

  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortConfig?.key !== key) {
      return <ArrowUpDown className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="w-3 h-3 text-gray-900" />
      : <ArrowDown className="w-3 h-3 text-gray-900" />;
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
    setRowStates((prev) => {
      const current = prev[id] ?? {
        editValue: "",
        isUpdating: false,
        feedback: null,
      };
      return { ...prev, [id]: { ...current, ...patch } };
    });
  };

  const handleUpdate = async (product: AdminProduct) => {
    const row = getRowState(product.id);
    const amount = parseFloat(row.editValue);

    if (isNaN(amount) || amount === 0) {
      updateRowState(product.id, {
        feedback: { type: "error", message: "Enter a non-zero amount to add." },
      });
      return;
    }

    updateRowState(product.id, { isUpdating: true, feedback: null });

    const result = await adjustProductStock({ productId: product.id, amount });

    if (!result.success) {
      updateRowState(product.id, {
        isUpdating: false,
        feedback: { type: "error", message: result.error },
      });
      return;
    }

    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, stock_sqft: result.newStock } : p))
    );

    updateRowState(product.id, {
      isUpdating: false,
      editValue: "",
      feedback: { type: "success", message: `Added ${amount > 0 ? "+" : ""}${amount} → ${result.newStock.toLocaleString()} sq ft` },
    });

    setTimeout(() => {
      updateRowState(product.id, { feedback: null });
    }, 3000);
  };

  const handleDelete = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) return;

    updateRowState(productId, { isUpdating: true, feedback: null });

    const result = await deleteProduct({ productId });

    if (!result.success) {
      updateRowState(productId, {
        isUpdating: false,
        feedback: { type: "error", message: result.error },
      });
      return;
    }

    setProducts((prev) => prev.filter((p) => p.id !== productId));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allVisibleSelected = paginatedProducts.length > 0 && paginatedProducts.every((p) => selectedIds.has(p.id));

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        paginatedProducts.forEach((p) => next.delete(p.id));
      } else {
        paginatedProducts.forEach((p) => next.add(p.id));
      }
      return next;
    });
  };

  const handleBulkRestock = async () => {
    const amount = parseFloat(bulkRestockAmount);
    if (selectedIds.size === 0 || isNaN(amount) || amount === 0) return;
    setIsBulkRestocking(true);

    const result = await bulkAdjustProductStock({
      productIds: Array.from(selectedIds),
      amount,
    });

    if (!result.success) {
      setIsBulkRestocking(false);
      return;
    }

    const newStockById = new Map(result.updates.map((u) => [u.id, u.newStock]));
    const failedIds = new Set(result.failed.map((f) => f.id));

    setProducts((prev) =>
      prev.map((p) =>
        newStockById.has(p.id) ? { ...p, stock_sqft: newStockById.get(p.id)! } : p
      )
    );

    setSelectedIds(failedIds);
    setBulkRestockAmount("");
    setIsBulkRestocking(false);
  };

  const handleExportCsv = () => {
    downloadCsv(
      `inventory-export-${new Date().toISOString().slice(0, 10)}.csv`,
      ["SKU", "Product Name", "Category", "Price per SqFt (LKR)", "Stock (SqFt)"],
      filteredProducts.map((p) => [p.sku, p.name, p.category_slug, p.price_per_sqft, p.stock_sqft])
    );
  };

  return (
    <div className="animate-[page-enter_300ms_ease-out]">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Inventory Management</h2>
          <p className="text-sm text-gray-500 mt-1">Restock adds to the current quantity on the same product.</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full md:w-auto">
          <button
            onClick={handleExportCsv}
            title="Export currently filtered products to CSV"
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-900 rounded-lg text-sm font-bold tracking-wide hover:bg-gray-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
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
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full pl-10 pr-4 py-2.5 bg-white shadow-sm text-sm text-gray-900 rounded-lg outline-none border border-gray-100 focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all"
        />
      </div>

      {selectedIds.size > 0 && (
        <div className="mb-4 flex flex-col sm:flex-row items-center gap-3 bg-zinc-900 text-white rounded-xl px-5 py-3 motion-fade-up">
          <span className="text-sm font-semibold">{selectedIds.size} selected</span>
          <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
            <input
              type="number"
              placeholder="+/- sq ft"
              value={bulkRestockAmount}
              onChange={(e) => setBulkRestockAmount(e.target.value)}
              className="w-28 bg-white/10 border border-white/20 text-white placeholder:text-gray-400 text-sm rounded-lg px-3 py-1.5 outline-none"
            />
            <button
              onClick={handleBulkRestock}
              disabled={isBulkRestocking || !bulkRestockAmount.trim()}
              className="px-3 py-1.5 bg-accent text-black text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
            >
              {isBulkRestocking ? "Applying..." : "Apply to Stock"}
            </button>
          </div>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-xs font-semibold text-gray-300 hover:text-white transition-colors"
          >
            Clear selection
          </button>
        </div>
      )}

      <div className="overflow-x-auto pb-8">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-3 w-[3%]">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAllVisible}
                  className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-accent"
                  aria-label="Select all visible products"
                />
              </th>
              <th
                className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[22%] text-left cursor-pointer hover:text-gray-900 transition-colors group"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">Product {renderSortIcon('name')}</div>
              </th>
              <th
                className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[15%] text-left cursor-pointer hover:text-gray-900 transition-colors group"
                onClick={() => handleSort('sku')}
              >
                <div className="flex items-center gap-1">SKU {renderSortIcon('sku')}</div>
              </th>
              <th
                className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[15%] text-left cursor-pointer hover:text-gray-900 transition-colors group"
                onClick={() => handleSort('category_slug')}
              >
                <div className="flex items-center gap-1">Category {renderSortIcon('category_slug')}</div>
              </th>
              <th
                className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[15%] text-right cursor-pointer hover:text-gray-900 transition-colors group"
                onClick={() => handleSort('price_per_sqft')}
              >
                <div className="flex items-center justify-end gap-1">Price {renderSortIcon('price_per_sqft')}</div>
              </th>
              <th 
                className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[15%] text-right cursor-pointer hover:text-gray-900 transition-colors group"
                onClick={() => handleSort('stock_sqft')}
              >
                <div className="flex items-center justify-end gap-1">Stock (sq ft) {renderSortIcon('stock_sqft')}</div>
              </th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[15%] text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <Package className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  No products found.
                </td>
              </tr>
            )}
            {paginatedProducts.map((product, index) => {
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
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(product.id)}
                      onChange={() => toggleSelected(product.id)}
                      className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-accent"
                      aria-label={`Select ${product.name}`}
                    />
                  </td>
                  <td className="px-6 py-3 text-left">
                    <div className="flex items-center gap-4">
                      <div className="relative w-9 h-9 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200/50">
                        {product.image ? (
                          <Image src={product.image} alt={product.name} fill sizes="36px" className="object-cover" />
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
                          placeholder="+/- sq ft"
                          value={row.editValue}
                          onChange={(e) => updateRowState(product.id, { editValue: e.target.value })}
                          className="w-20 text-center px-2 py-1 text-xs font-mono font-bold bg-transparent outline-none text-gray-900 placeholder:text-gray-400 placeholder:font-sans"
                        />
                        <button
                          onClick={() => handleUpdate(product)}
                          disabled={row.isUpdating || !row.editValue.trim()}
                          className="px-3 py-1 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-yellow-500 hover:text-black disabled:opacity-30 disabled:hover:bg-zinc-900 disabled:hover:text-white transition-all active:scale-95 flex items-center justify-center min-w-[40px]"
                        >
                          {row.isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add"}
                        </button>
                      </div>
                      
                      {/* Quick Increment Buttons and Delete */}
                      <div className="flex items-center gap-1 justify-between w-full">
                        <div className="flex items-center gap-1">
                          {[50, 100].map((inc) => (
                            <button
                              key={inc}
                              onClick={() => {
                                const typed = parseFloat(getRowState(product.id).editValue);
                                const next = (isNaN(typed) ? 0 : typed) + inc;
                                updateRowState(product.id, { editValue: String(next) });
                              }}
                              className="text-[9px] font-mono font-bold text-gray-500 hover:text-zinc-900 bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded transition-colors"
                            >
                              +{inc}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          disabled={row.isUpdating}
                          className="text-gray-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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

      <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-50/50">
        <p className="text-xs text-gray-500 font-medium">
          Showing {paginatedProducts.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
          {"–"}
          {Math.min(currentPage * PAGE_SIZE, filteredProducts.length)} of {filteredProducts.length}{" "}
          {filteredProducts.length === 1 ? "product" : "products"}
        </p>
        <div className="flex gap-1">
          <button
            className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="w-8 h-8 rounded border border-gray-900 bg-gray-900 flex items-center justify-center text-white text-xs font-bold">
            {currentPage}
          </span>
          <button
            className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
