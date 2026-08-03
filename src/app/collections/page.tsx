import Image from "next/image";
import Link from "next/link";
import { getCatalogData } from "@/data/products";

type CollectionsPageProps = {
  searchParams: Promise<{
    category?: string | string[];
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

  const activeCategory = categories.find(
    (category) => category.slug === categoryParam
  );

  const visibleProducts = activeCategory
    ? allProducts.filter(
        (product) => product.categorySlug === activeCategory.slug
      )
    : allProducts;

  const dimensions = Array.from(
    new Set(allProducts.map((product) => product.dimensions))
  );

  return (
    <div className="flex flex-col min-h-screen pt-12 pb-24">
      <div className="max-w-7xl mx-auto px-6 w-full">
        
        {/* Header */}
        <div className="mb-16 border-b ghost-border pb-12 motion-fade-up">
          <h1 className="text-4xl md:text-5xl font-display font-medium tracking-tight text-on-surface mb-6">
            The Collections
          </h1>
          <p className="text-on-surface-variant max-w-2xl leading-relaxed">
            {activeCategory
              ? `Showing ${activeCategory.name}. Browse the latest in this segment and refine by dimensions.`
              : "Browse our full archive of architectural slabs. Use the structural filters below to refine by scale, application, and finish."}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-12">
          
          {/* Filters Sidebar */}
          <aside className="w-full md:w-64 flex-shrink-0 motion-fade-up motion-delay-1">
            <div className="sticky top-32 space-y-10">
              
              <div>
                <h3 className="text-sm font-semibold tracking-widest uppercase text-on-surface mb-5">Categories</h3>
                <ul className="space-y-4">
                  <li>
                    <Link
                      href="/collections"
                      className="flex items-center space-x-3 cursor-pointer group kinetic-link"
                    >
                      <div
                        className={`w-4 h-4 border transition-colors flex items-center justify-center ${
                          !activeCategory
                            ? "border-primary bg-primary"
                            : "border-outline group-hover:border-primary"
                        }`}
                      >
                        {!activeCategory ? (
                          <span className="w-1.5 h-1.5 bg-on-primary rounded-full" />
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
                              ? "border-primary bg-primary"
                              : "border-outline group-hover:border-primary"
                          }`}
                        >
                          {activeCategory?.slug === c.slug ? (
                            <span className="w-1.5 h-1.5 bg-on-primary rounded-full" />
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

              <div>
                <h3 className="text-sm font-semibold tracking-widest uppercase text-on-surface mb-5">Dimensions</h3>
                <ul className="space-y-4">
                  {dimensions.map((dim) => (
                    <li key={dim}>
                      <label className="flex items-center space-x-3 cursor-pointer group">
                        <div className="w-4 h-4 border border-outline group-hover:border-primary transition-colors flex items-center justify-center"></div>
                        <span className="text-sm text-on-surface-variant group-hover:text-on-surface">{dim}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </aside>

          {/* Grid */}
          <div className="flex-1 motion-fade-up motion-delay-2">
            <div className="flex justify-between items-center mb-8">
              <span className="text-sm text-on-surface-variant">{visibleProducts.length} Results</span>
              <select className="bg-transparent border-none outline-none text-sm text-on-surface font-semibold tracking-wide uppercase cursor-pointer">
                <option>Sort By: Featured</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {visibleProducts.map((product, idx) => (
                <div
                  key={product.id}
                  className="group bg-surface-container-lowest interactive-card motion-fade-up"
                  style={{ animationDelay: `${120 + idx * 60}ms` }}
                >
                  <div className="relative aspect-square mb-6 overflow-hidden bg-surface-container">
                    <Image 
                      src={product.image} 
                      alt={product.name} 
                      fill 
                      className="object-cover"
                    />
                  </div>
                  <div className="space-y-1 mb-4">
                    <p className="text-xs uppercase tracking-widest text-outline">{product.category}</p>
                    <h3 className="text-lg font-display text-on-surface">{product.name}</h3>
                    <div className="flex items-center space-x-4 text-sm mt-2">
                      <span className="text-on-surface-variant">{product.dimensions}</span>
                      <span className="text-outline-variant">•</span>
                      <span className="font-semibold text-on-surface">{product.price} / sq ft</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
