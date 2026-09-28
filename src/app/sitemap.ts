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
      priority: 0.95,
    },
    {
      url: `${BASE_URL}/planner`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/visual-search`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
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
 * Fetches all published products via the unified catalog layer.
 * Products are mapped to permanent canonical /collections/[id] URLs.
 */
async function getProductRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    const { allProducts, categories } = await getCatalogData();
    const now = new Date();

    const productEntries: MetadataRoute.Sitemap = (allProducts || []).map((product) => ({
      url: `${BASE_URL}/collections/${product.id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    const categoryEntries: MetadataRoute.Sitemap = (categories || []).map((cat) => ({
      url: `${BASE_URL}/collections?category=${cat.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    }));

    return [...categoryEntries, ...productEntries];
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
