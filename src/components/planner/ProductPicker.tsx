"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Check, ChevronDown, Search } from "lucide-react";
import type { Product } from "@/data/products";

function formatPrice(pricePerSqft: number): string {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(pricePerSqft);
}

export function ProductPicker({
  products,
  selectedId,
  onSelect,
}: {
  products: Product[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = products.find((p) => p.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.dimensions.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.finish.toLowerCase().includes(q)
    );
  }, [products, query]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full min-h-14 flex items-center gap-3 px-3 py-2 bg-white rounded-xl border border-gray-200 text-left hover:border-accent/50 transition-colors"
      >
        {selected ? (
          <>
            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-surface-container">
              <Image
                src={selected.image}
                alt=""
                fill
                sizes="40px"
                className="object-cover"
              />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-zinc-900 truncate">
                {selected.name}
              </span>
              <span className="block text-[11px] text-gray-500 truncate">
                {selected.dimensions} · {formatPrice(selected.pricePerSqft)}/sq ft
              </span>
            </span>
          </>
        ) : (
          <span className="flex-1 text-sm text-gray-400 px-1">Choose a tile</span>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
          <div className="relative p-2 border-b border-gray-100">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, size, finish…"
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg bg-gray-50 border border-gray-200 outline-none focus:border-accent"
            />
          </div>
          <ul className="max-h-72 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-4 py-6 text-sm text-gray-500 text-center">No matching tiles.</li>
            )}
            {filtered.map((product) => {
              const isSelected = product.id === selectedId;
              return (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(product.id);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent/5 ${
                      isSelected ? "bg-accent/10" : ""
                    }`}
                  >
                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-surface-container">
                      <Image
                        src={product.image}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-zinc-900 truncate">
                        {product.name}
                      </span>
                      <span className="block text-[11px] text-gray-500 truncate">
                        {product.dimensions} · {formatPrice(product.pricePerSqft)}/sq ft
                      </span>
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-accent shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
