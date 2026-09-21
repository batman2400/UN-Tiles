import type { MetadataRoute } from "next";
import { getCatalogData } from "@/data/products";

const BASE_URL = "https://www.untiles.com";

/**
 * Core static routes with SEO-appropriate priorities and change frequencies.
 * These are always included regardless of database availability.
 */
function getStaticRoutes(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/collections`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/planner`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/visual-search`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}

/**
 * Fetches all published products via the unified catalog layer (which reads live
 * Supabase rows with graceful in-memory caching and fallback json).
 * Products are mapped to /collections?product=[id] URLs.
 */
async function getProductRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    const { allProducts } = await getCatalogData();
    const now = new Date();

    if (!allProducts || allProducts.length === 0) {
      return [];
    }

    return allProducts.map((product) => ({
      url: `${BASE_URL}/collections?product=${product.id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch (err) {
    console.error("[sitemap] Failed to fetch product routes:", err);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = getStaticRoutes();
  const productRoutes = await getProductRoutes();

  return [...staticRoutes, ...productRoutes];
}
