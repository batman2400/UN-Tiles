"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ScrollReveal } from "@/components/ScrollReveal";
import { ProductCard } from "@/components/ProductCard";
import { Product, CategoryCard } from "@/data/products";
import { Search, X, SlidersHorizontal } from "lucide-react";

interface CollectionsClientProps {
  allProducts: Product[];
  categories: CategoryCard[];
  initialCategory?: string;
  initialDims?: string[];
  initialQuery?: string;
}

export function CollectionsClient({
  allProducts,
  categories,
  initialCategory = "",
  initialDims = [],
  initialQuery = "",
}: CollectionsClientProps) {
  const searchParams = useSearchParams();

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedDims, setSelectedDims] = useState<string[]>(initialDims);
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc">("featured");

  // Keep local state synchronized if URL search params change (e.g., from top navbar search)
  useEffect(() => {
    const cat = searchParams.get("category") || "";
    const q = searchParams.get("q") || "";
    const dims = searchParams.getAll("dim").map((d) => d.replace(/\+/g, " "));

    setSelectedCategory(cat);
    setSearchQuery(q);
    setSelectedDims(dims);
  }, [searchParams]);

  // Sync active filters to URL cleanly without triggering full server re-renders
  const updateURL = (cat: string, dims: string[], q: string) => {
    const params = new URLSearchParams();
    if (cat) params.set("category", cat);
    dims.forEach((d) => params.append("dim", d));
    if (q) params.set("q", q);

    const queryString = params.toString();
    const newPath = queryString ? `/collections?${queryString}` : "/collections";
    window.history.replaceState(null, "", newPath);
  };

  const handleCategorySelect = (slug: string) => {
    const newCat = selectedCategory === slug ? "" : slug;
    setSelectedCategory(newCat);
    updateURL(newCat, selectedDims, searchQuery);
  };

  const handleDimToggle = (dim: string) => {
    const nextDims = selectedDims.includes(dim)
      ? selectedDims.filter((d) => d !== dim)
      : [...selectedDims, dim];
    setSelectedDims(nextDims);
    updateURL(selectedCategory, nextDims, searchQuery);
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    updateURL(selectedCategory, selectedDims, q);
  };

  const clearAllFilters = () => {
    setSelectedCategory("");
    setSelectedDims([]);
    setSearchQuery("");
    updateURL("", [], "");
  };

  // ⚡ Instant client-side filtering & sorting in <1ms
  const filteredProducts = useMemo(() => {
    let result = allProducts;

    // 1. Category Filter
    if (selectedCategory) {
      result = result.filter((p) => p.categorySlug === selectedCategory);
    }

    // 2. Dimensions Filter
    if (selectedDims.length > 0) {
      result = result.filter((p) => selectedDims.includes(p.dimensions));
    }

    // 3. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.finish.toLowerCase().includes(q) ||
          p.dimensions.toLowerCase().includes(q)
      );
    }

    // 4. Sorting
    if (sortBy === "price-asc") {
      result = [...result].sort((a, b) => a.pricePerSqft - b.pricePerSqft);
    } else if (sortBy === "price-desc") {
      result = [...result].sort((a, b) => b.pricePerSqft - a.pricePerSqft);
    }

    return result;
  }, [allProducts, selectedCategory, selectedDims, searchQuery, sortBy]);

  const activeCategoryObj = categories.find((c) => c.slug === selectedCategory);

  const availableDimensions = useMemo(() => {
    return Array.from(new Set(allProducts.map((p) => p.dimensions)));
  }, [allProducts]);

  const hasActiveFilters = Boolean(selectedCategory || selectedDims.length > 0 || searchQuery);

  return (
    <div className="flex flex-col min-h-screen">
      {/* ══════ HERO HEADER ══════ */}
      <section className="relative h-[35vh] min-h-[260px] flex items-end bg-surface-dark overflow-hidden">
        <Image
          src="/images/contact_hero.png"
          alt="Tile showroom"
          fill
          sizes="100vw"
          className="object-cover opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-10 w-full motion-fade-up">
          <p className="text-xs uppercase tracking-[0.2em] text-accent font-semibold mb-2">
            {searchQuery
              ? `Search Results for "${searchQuery}"`
              : activeCategoryObj
              ? activeCategoryObj.name
              : "All Collections"}
          </p>
          <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight text-white mb-3">
            {searchQuery ? "Search Results" : "The Collections"}
          </h1>
          <p className="text-white/70 text-sm max-w-2xl">
            {searchQuery
              ? `Found ${filteredProducts.length} matching architectural tile specifications.`
              : activeCategoryObj
              ? `Exploring ${activeCategoryObj.name}. Refine by dimensions or search terms below.`
              : "Browse our complete archive of architectural slabs. Refine instantaneously by category, dimension, and finish."}
          </p>
        </div>
      </section>

      {/* ══════ MAIN CONTENT ══════ */}
      <div className="max-w-7xl mx-auto px-6 w-full py-10">
        
        {/* Instant Search Bar & Active Filter Badges */}
        <div className="mb-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-gray-50/80 p-4 rounded-2xl border border-gray-200/80">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by tile name, category, finish, dimension..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-white shadow-sm text-sm text-zinc-900 rounded-xl outline-none border border-gray-200 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/20 transition-all placeholder:text-gray-400 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-zinc-900 rounded-full transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active:</span>
              {selectedCategory && (
                <span className="inline-flex items-center gap-1 text-xs font-bold bg-yellow-500/10 text-yellow-700 px-2.5 py-1 rounded-lg border border-yellow-500/20">
                  {categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}
                  <button onClick={() => handleCategorySelect(selectedCategory)} className="hover:text-black">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedDims.map((dim) => (
                <span key={dim} className="inline-flex items-center gap-1 text-xs font-bold bg-zinc-100 text-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-200">
                  {dim}
                  <button onClick={() => handleDimToggle(dim)} className="hover:text-black">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <button
                onClick={clearAllFilters}
                className="text-xs font-bold uppercase tracking-wider text-red-600 hover:underline px-2 py-1"
              >
                Reset All
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-10">
          {/* Filters Sidebar */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <div className="sticky top-28 space-y-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              {/* Category Filter */}
              <div>
                <h3 className="text-xs font-bold tracking-widest uppercase text-zinc-900 mb-4 flex items-center justify-between">
                  <span>Categories</span>
                  <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
                </h3>
                <ul className="space-y-2">
                  <li>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory("")}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                        !selectedCategory
                          ? "bg-zinc-900 text-white font-bold shadow-sm"
                          : "text-gray-600 hover:bg-gray-100 hover:text-zinc-900"
                      }`}
                    >
                      <span>All Categories</span>
                      <span className="font-mono opacity-80">({allProducts.length})</span>
                    </button>
                  </li>
                  {categories.map((c) => {
                    const isSelected = selectedCategory === c.slug;
                    return (
                      <li key={c.slug}>
                        <button
                          type="button"
                          onClick={() => handleCategorySelect(c.slug)}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                            isSelected
                              ? "bg-yellow-500 text-zinc-950 font-bold shadow-sm"
                              : "text-gray-600 hover:bg-gray-100 hover:text-zinc-900"
                          }`}
                        >
                          <span>{c.name}</span>
                          <span className="font-mono opacity-80">({c.items})</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="h-[1px] bg-gray-100" />

              {/* Dimensions Filter */}
              <div>
                <h3 className="text-xs font-bold tracking-widest uppercase text-zinc-900 mb-4">Dimensions</h3>
                <div className="space-y-2">
                  {availableDimensions.map((dim) => {
                    const isChecked = selectedDims.includes(dim);
                    return (
                      <label
                        key={dim}
                        className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors text-xs font-medium ${
                          isChecked ? "bg-gray-100 text-zinc-900 font-semibold" : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleDimToggle(dim)}
                          className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500 cursor-pointer"
                        />
                        <span>{dim}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid Area */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Showing <strong className="text-zinc-900 font-bold">{filteredProducts.length}</strong> {filteredProducts.length === 1 ? "Specification" : "Specifications"}
              </span>

              {/* Sorting */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-medium">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-zinc-900 px-3 py-2 outline-none cursor-pointer focus:border-yellow-500 transition-all"
                >
                  <option value="featured">Featured First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Product Cards Grid */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                <p className="text-base font-display font-bold text-zinc-900 mb-2">No Matching Tiles Found</p>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
                  Try clearing your active category or dimension filters to view more products.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="bg-zinc-900 text-white hover:bg-yellow-500 hover:text-black font-semibold rounded-xl py-3 px-6 text-xs uppercase tracking-widest transition-all shadow-md"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product, idx) => (
                  <ScrollReveal key={product.id} delay={(idx % 6) * 40}>
                    <ProductCard product={product} />
                  </ScrollReveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
