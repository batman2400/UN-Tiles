"use client";

import { useState, useMemo } from "react";
import { CheckCircle, AlertTriangle, Package, Search } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import type { AdminProduct } from "./page";

// ── Types ──────────────────────────────────────────────

interface RowState {
  editValue: string;
  isUpdating: boolean;
  feedback: { type: "success" | "error"; message: string } | null;
}

// ── Component ──────────────────────────────────────────

export function AdminStockEditor({
  initialProducts,
}: {
  initialProducts: AdminProduct[];
}) {
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
        feedback: { type: "error", message: "Enter a valid positive number." },
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

    // Update local state
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, stock_sqft: newStock } : p
      )
    );

    updateRowState(product.id, {
      isUpdating: false,
      editValue: "",
      feedback: { type: "success", message: "Stock updated" },
    });

    // Clear feedback after 3s
    setTimeout(() => {
      updateRowState(product.id, { feedback: null });
    }, 3000);
  };

  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);

  return (
    <div className="bg-surface-container-lowest premium-shadow">
      {/* Search Bar */}
      <div className="p-6 border-b border-outline-variant/15">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search by name, SKU, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-surface-container-low text-sm text-on-surface outline-none form-field-animate focus:bg-surface-container border border-transparent focus:border-primary/30 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-outline-variant/15">
              <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                SKU
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                Product
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                Category
              </th>
              <th className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                Price / sq ft
              </th>
              <th className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                Current Stock
              </th>
              <th className="text-center px-6 py-4 text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                Restock
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <Package className="w-10 h-10 mx-auto mb-4 text-on-surface-variant opacity-40" />
                  <p className="text-sm text-on-surface-variant">
                    {searchQuery ? "No products match your search." : "No products found."}
                  </p>
                </td>
              </tr>
            )}

            {filteredProducts.map((product) => {
              const row = getRowState(product.id);
              const isLowStock = product.stock_sqft < 100;

              return (
                <tr
                  key={product.id}
                  className="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors"
                >
                  {/* SKU */}
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs text-on-surface-variant">
                      {product.sku}
                    </span>
                  </td>

                  {/* Name */}
                  <td className="px-6 py-4">
                    <span className="font-display font-semibold text-sm text-on-surface">
                      {product.name}
                    </span>
                  </td>

                  {/* Category */}
                  <td className="px-6 py-4">
                    <span className="text-xs uppercase tracking-widest text-accent font-semibold">
                      {product.category_slug.replace(/-/g, " ")}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm text-on-surface font-medium">
                      {formatCurrency(product.price_per_sqft)}
                    </span>
                  </td>

                  {/* Current Stock */}
                  <td className="px-6 py-4 text-right">
                    <span
                      className={`text-sm font-bold ${
                        isLowStock ? "text-[#9f403d]" : "text-on-surface"
                      }`}
                    >
                      {product.stock_sqft.toLocaleString()}
                      <span className="text-on-surface-variant font-normal ml-1">sq ft</span>
                    </span>
                    {isLowStock && (
                      <span className="ml-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-[#9f403d] font-semibold">
                        <AlertTriangle className="w-3 h-3" />
                        Low
                      </span>
                    )}
                  </td>

                  {/* Restock Action */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="number"
                        min={0}
                        placeholder="New qty"
                        value={row.editValue}
                        onChange={(e) =>
                          updateRowState(product.id, { editValue: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            void handleUpdate(product);
                          }
                        }}
                        className="w-24 text-center bg-transparent border-b border-outline py-2 text-sm text-on-surface outline-none form-field-animate focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        onClick={() => handleUpdate(product)}
                        disabled={row.isUpdating || !row.editValue.trim()}
                        className="px-4 py-2 bg-primary hover:bg-primary-dim text-on-primary text-xs font-semibold uppercase tracking-widest transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {row.isUpdating ? "..." : "Set"}
                      </button>
                    </div>

                    {/* Row feedback */}
                    {row.feedback && (
                      <div
                        className={`mt-2 flex items-center justify-center gap-1 text-xs motion-fade-up ${
                          row.feedback.type === "success"
                            ? "text-primary"
                            : "text-[#9f403d]"
                        }`}
                      >
                        {row.feedback.type === "success" ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <AlertTriangle className="w-3 h-3" />
                        )}
                        {row.feedback.message}
                      </div>
                    )}
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
