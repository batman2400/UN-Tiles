import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCatalogData } from "@/data/products";
import { ProductCard } from "@/components/ProductCard";
import { ProductDetailActions } from "./ProductDetailActions";
import { ShieldCheck, Truck, MapPin, Sparkles, ChevronRight } from "lucide-react";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const { allProducts } = await getCatalogData();
  return allProducts.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const { allProducts } = await getCatalogData();
  const product = allProducts.find((p) => p.id === id);

  if (!product) {
    return {
      title: "Tile Not Found",
    };
  }

  const title = `Buy ${product.name} Tile in Sri Lanka (${product.dimensions}) | UN Tiles`;
  const description = `Purchase ${product.name} ${product.dimensions} ${product.category} tile in Sri Lanka at UN Tiles. LKR ${product.pricePerSqft}/sq ft. ${product.finish} finish with islandwide delivery or Colombo 05 showroom pickup.`;

  return {
    title,
    description,
    keywords: [
      `buy ${product.name.toLowerCase()} tile sri lanka`,
      `purchase ${product.name.toLowerCase()} tile`,
      `buy ${product.category.toLowerCase()} sri lanka`,
      `${product.dimensions} tiles sri lanka`,
      `${product.finish.toLowerCase()} tile price in sri lanka`,
      "buy tiles in sri lanka",
      "tiles shop colombo",
    ],
    alternates: {
      canonical: `/collections/${product.id}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.untiles.com/collections/${product.id}`,
      images: [
        {
          url: product.image.startsWith("http")
            ? product.image
            : `https://www.untiles.com${product.image}`,
          alt: `${product.name} Tile - Buy in Sri Lanka`,
        },
      ],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = await params;
  const { allProducts } = await getCatalogData();
  const product = allProducts.find((p) => p.id === id);

  if (!product) {
    notFound();
  }

  const relatedProducts = allProducts
    .filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id)
    .slice(0, 4);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.image.startsWith("http")
      ? product.image
      : `https://www.untiles.com${product.image}`,
    description: `Buy ${product.name} ${product.finish} ${product.category} tile in Sri Lanka. Dimensions: ${product.dimensions}. Available at UN Tiles showroom and online store with islandwide delivery.`,
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: "UN Tiles",
    },
    offers: {
      "@type": "Offer",
      url: `https://www.untiles.com/collections/${product.id}`,
      priceCurrency: "LKR",
      price: product.pricePerSqft,
      priceValidUntil: "2027-12-31",
      itemCondition: "https://schema.org/NewCondition",
      availability:
        product.stockSqft > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "UN Tiles (Unicorn Enterprises)",
      },
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.untiles.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Buy Tiles",
        item: "https://www.untiles.com/collections",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.category,
        item: `https://www.untiles.com/collections?category=${product.categorySlug}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: product.name,
        item: `https://www.untiles.com/collections/${product.id}`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background text-on-surface pt-24 sm:pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="max-w-7xl mx-auto space-y-12">
        {/* Breadcrumb row */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-on-surface-variant flex-wrap">
          <Link href="/" className="hover:text-accent transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-outline" />
          <Link href="/collections" className="hover:text-accent transition-colors">Buy Tiles</Link>
          <ChevronRight className="w-3.5 h-3.5 text-outline" />
          <Link
            href={`/collections?category=${product.categorySlug}`}
            className="hover:text-accent transition-colors"
          >
            {product.category}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-outline" />
          <span className="font-semibold text-on-surface truncate">{product.name}</span>
        </nav>

        {/* Product Main Display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          {/* Left: Tile Image Preview */}
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-surface-container border border-outline/30 premium-shadow-lg">
            <Image
              src={product.image}
              alt={`Buy ${product.name} ${product.category} tile in Sri Lanka`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute top-4 left-4 z-10">
              <span className="px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-semibold uppercase tracking-wider">
                {product.category}
              </span>
            </div>
          </div>

          {/* Right: Product Details & Purchase Actions */}
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold uppercase tracking-widest mb-3">
                <Sparkles className="w-3 h-3" />
                <span>Available to Buy in Sri Lanka</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-on-surface tracking-tight">
                {product.name}
              </h1>
              <p className="text-sm sm:text-base text-on-surface-variant mt-2">
                Premium {product.finish.toLowerCase()} finish {product.category.toLowerCase()} designed for residential and commercial spaces in Sri Lanka.
              </p>
            </div>

            {/* Interactive Buy & Add to Cart Component */}
            <ProductDetailActions product={product} />

            {/* Specifications Table */}
            <div className="pt-6 border-t border-outline/20 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-on-surface">
                Specifications
              </h2>
              <dl className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="p-3 rounded-xl bg-surface-container/40 border border-outline/20">
                  <dt className="text-on-surface-variant text-[11px] uppercase tracking-wider">Dimensions</dt>
                  <dd className="font-semibold text-on-surface mt-1">{product.dimensions}</dd>
                </div>
                <div className="p-3 rounded-xl bg-surface-container/40 border border-outline/20">
                  <dt className="text-on-surface-variant text-[11px] uppercase tracking-wider">Surface Finish</dt>
                  <dd className="font-semibold text-on-surface mt-1">{product.finish}</dd>
                </div>
                <div className="p-3 rounded-xl bg-surface-container/40 border border-outline/20">
                  <dt className="text-on-surface-variant text-[11px] uppercase tracking-wider">Category</dt>
                  <dd className="font-semibold text-on-surface mt-1">{product.category}</dd>
                </div>
                <div className="p-3 rounded-xl bg-surface-container/40 border border-outline/20">
                  <dt className="text-on-surface-variant text-[11px] uppercase tracking-wider">Price / Sq Ft</dt>
                  <dd className="font-semibold text-on-surface mt-1">
                    {new Intl.NumberFormat("en-LK", {
                      style: "currency",
                      currency: "LKR",
                      minimumFractionDigits: 0,
                    }).format(product.pricePerSqft)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Delivery & Showroom Guarantee */}
            <div className="p-5 rounded-2xl bg-surface-container/60 border border-outline/30 space-y-3">
              <div className="flex items-start gap-3">
                <Truck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div className="text-xs text-on-surface leading-relaxed">
                  <strong>Islandwide Delivery across Sri Lanka:</strong> Safe packaging and transport to Colombo, Kandy, Galle, Gampaha, Kurunegala, and all other districts.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div className="text-xs text-on-surface leading-relaxed">
                  <strong>Showroom Viewing:</strong> View physical samples at No. 161/A, Polhengoda Road, Colombo 05.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div className="text-xs text-on-surface leading-relaxed">
                  <strong>Direct Importer Quality:</strong> Sourced directly by Unicorn Enterprises with 20+ years of architectural excellence in Sri Lanka.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Tiles */}
        {relatedProducts.length > 0 && (
          <div className="pt-14 sm:pt-20 border-t border-outline/20 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-accent font-semibold mb-1">More Options</p>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-on-surface">
                  Related {product.category} in Sri Lanka
                </h2>
              </div>
              <Link
                href={`/collections?category=${product.categorySlug}`}
                className="text-xs font-bold uppercase tracking-wider text-accent hover:underline hidden sm:block"
              >
                View All {product.category} &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
