import Image from "next/image";
import Link from "next/link";
import { getCatalogData } from "@/data/products";
import { ScrollReveal } from "@/components/ScrollReveal";
import { ProductCard } from "@/components/ProductCard";

type CollectionsPageProps = {
  searchParams: Promise<{
    category?: string | string[];
    dim?: string | string[];
    q?: string | string[];
  }>;
};

export default async function Collections({
  searchParams,
}: CollectionsPageProps) {
  const [{ allProducts, categories }, resolvedSearchParams] = await Promise.all([
    getCatalogData(),
    searchParams,
  ]);

  const categoryParam = Array.isArray(resolvedSearchParams.category)
    ? resolvedSearchParams.category[0]
    : resolvedSearchParams.category;

  const dimParams = resolvedSearchParams.dim 
    ? (Array.isArray(resolvedSearchParams.dim) ? resolvedSearchParams.dim : [resolvedSearchParams.dim]).map(d => d.replace(/\+/g, ' '))
    : [];

  const qParam = resolvedSearchParams.q 
    ? (Array.isArray(resolvedSearchParams.q) ? resolvedSearchParams.q[0] : resolvedSearchParams.q).toLowerCase()
    : "";

  const activeCategory = categories.find(
    (category) => category.slug === categoryParam
  );

  let visibleProducts = activeCategory
    ? allProducts.filter((product) => product.categorySlug === activeCategory.slug)
    : allProducts;
    
  if (dimParams.length > 0) {
    visibleProducts = visibleProducts.filter(p => dimParams.includes(p.dimensions));
  }

  if (qParam) {
    visibleProducts = visibleProducts.filter(p => 
      p.name.toLowerCase().includes(qParam) || 
      p.category.toLowerCase().includes(qParam)
    );
  }

  const dimensions = Array.from(
    new Set(allProducts.map((product) => product.dimensions))
  );

  return (
    <div className="flex flex-col min-h-screen">

      {/* ══════ COMPACT HERO ══════ */}
      <section className="relative h-[40vh] min-h-[280px] flex items-end bg-surface-dark overflow-hidden">
        <Image
          src="/images/contact_hero.png"
          alt="Tile showroom"
          fill
          sizes="100vw"
          className="object-cover opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-12 w-full motion-fade-up">
          <p className="text-sm uppercase tracking-[0.2em] text-accent font-semibold mb-3">
            {qParam ? `Search Results for "${qParam}"` : (activeCategory ? activeCategory.name : "All Collections")}
          </p>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-white mb-4">
            {qParam ? "Search Results" : "The Collections"}
          </h1>
          <p className="text-white/70 max-w-2xl">
            {qParam 
              ? `Found ${visibleProducts.length} results matching your search.`
              : (activeCategory
                ? `Showing ${activeCategory.name}. Browse the latest in this segment and refine by dimensions.`
                : "Browse our full archive of architectural slabs. Use the structural filters to refine by scale, application, and finish.")}
          </p>
        </div>
      </section>

      {/* ══════ MAIN CONTENT ══════ */}
      <div className="max-w-7xl mx-auto px-6 w-full py-12">
        <div className="flex flex-col md:flex-row gap-12">
          
          {/* Filters Sidebar */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-10">
              
              <div>
                <h3 className="text-sm font-semibold tracking-widest uppercase text-on-surface mb-5">Categories</h3>
                <ul className="space-y-3">
                  <li>
                    <Link
                      href="/collections"
                      className="flex items-center space-x-3 cursor-pointer group kinetic-link"
                    >
                      <div
                        className={`w-4 h-4 border transition-colors flex items-center justify-center ${
                          !activeCategory
                            ? "border-accent bg-accent"
                            : "border-outline group-hover:border-accent"
                        }`}
                      >
                        {!activeCategory ? (
                          <span className="w-1.5 h-1.5 bg-on-accent rounded-full" />
                        ) : null}
                      </div>
                      <span
                        className={`text-sm ${
                          !activeCategory
                            ? "text-on-surface font-semibold"
                            : "text-on-surface-variant group-hover:text-on-surface"
                        }`}
                      >
                        All Categories
                      </span>
                    </Link>
                  </li>
                  {categories.map(c => (
                    <li key={c.slug}>
                      <Link
                        href={`/collections?category=${c.slug}`}
                        className="flex items-center space-x-3 cursor-pointer group kinetic-link"
                      >
                        <div
                          className={`w-4 h-4 border transition-colors flex items-center justify-center ${
                            activeCategory?.slug === c.slug
                              ? "border-accent bg-accent"
                              : "border-outline group-hover:border-accent"
                          }`}
                        >
                          {activeCategory?.slug === c.slug ? (
                            <span className="w-1.5 h-1.5 bg-on-accent rounded-full" />
                          ) : null}
                        </div>
                        <span
                          className={`text-sm ${
                            activeCategory?.slug === c.slug
                              ? "text-on-surface font-semibold"
                              : "text-on-surface-variant group-hover:text-on-surface"
                          }`}
                        >
                          {c.name} ({c.items})
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="section-divider" />

              <div>
                <h3 className="text-sm font-semibold tracking-widest uppercase text-on-surface mb-5">Dimensions</h3>
                <ul className="space-y-3">
                  {dimensions.map((dim) => {
                    const isActive = dimParams.includes(dim);
                    const newDimParams = isActive 
                      ? dimParams.filter(d => d !== dim) 
                      : [...dimParams, dim];
                    
                    const query = new URLSearchParams();
                    if (categoryParam) query.set("category", categoryParam);
                    newDimParams.forEach(d => query.append("dim", d));
                    
                    return (
                      <li key={dim}>
                        <Link href={`/collections?${query.toString()}`} className="flex items-center space-x-3 cursor-pointer group">
                          <div className={`w-4 h-4 border flex items-center justify-center transition-colors ${isActive ? 'bg-accent border-accent' : 'border-outline group-hover:border-accent'}`}>
                            {isActive && <span className="w-2 h-2 bg-white rounded-sm" />}
                          </div>
                          <span className={`text-sm ${isActive ? 'text-on-surface font-semibold' : 'text-on-surface-variant group-hover:text-on-surface'}`}>{dim}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>

            </div>
          </aside>

          {/* Grid */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-8">
              <span className="text-sm text-on-surface-variant">{visibleProducts.length} Results</span>
              <select className="bg-transparent border-none outline-none text-sm text-on-surface font-semibold tracking-wide uppercase cursor-pointer">
                <option>Sort By: Featured</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {visibleProducts.map((product, idx) => (
                <ScrollReveal key={product.id} delay={idx * 60}>
                  <ProductCard product={product} />
                </ScrollReveal>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
