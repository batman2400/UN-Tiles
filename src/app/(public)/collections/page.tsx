import { Suspense } from "react";
import { preload } from "react-dom";
import type { Metadata } from "next";
import { getCatalogData } from "@/data/products";
import { CollectionsClient } from "./CollectionsClient";
import CollectionsLoading from "./loading";

export const metadata: Metadata = {
  title: "Tile Collections",
  description:
    "Browse our curated collection of premium architectural tiles — floor tiles, wall tiles, porcelain slabs, and ceramic finishes for residential and commercial projects.",
  alternates: { canonical: "/collections" },
  openGraph: {
    title: "Tile Collections | UN Tiles",
    description:
      "Browse premium architectural tiles — floor tiles, wall tiles, porcelain slabs, and ceramic finishes sourced from leading manufacturers.",
    url: "https://www.untiles.com/collections",
  },
};

export default function Collections() {
  preload("/images/contact_hero_v6.jpg", { as: "image", fetchPriority: "high" });

  return (
    <Suspense fallback={<CollectionsLoading />}>
      <CollectionsContent />
    </Suspense>
  );
}

async function CollectionsContent() {
  const { allProducts, categories } = await getCatalogData();

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "UN Tiles Product Collections",
    description:
      "Browse premium architectural tiles — floor tiles, wall tiles, porcelain slabs, and ceramic finishes.",
    numberOfItems: allProducts.length,
    itemListElement: allProducts.slice(0, 50).map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: product.name,
        description: `${product.name} — ${product.dimensions}, ${product.finish} finish. ${product.category} tile.`,
        image: product.image.startsWith("http")
          ? product.image
          : `https://www.untiles.com${product.image}`,
        category: product.category,
        offers: {
          "@type": "Offer",
          price: product.pricePerSqft,
          priceCurrency: "LKR",
          unitText: "per sq ft",
          availability:
            product.stockSqft > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          seller: {
            "@type": "Organization",
            name: "UN Tiles",
          },
        },
      },
    })),
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
        name: "Collections",
        item: "https://www.untiles.com/collections",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CollectionsClient
        allProducts={allProducts}
        categories={categories}
      />
    </>
  );
}
