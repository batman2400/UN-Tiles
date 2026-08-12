import catalogSeed from "./catalog.json";
import { createClient } from "@supabase/supabase-js";

export type ProductCard = {
  id: string;
  name: string;
  dimensions: string;
  price: string;
  image: string;
  category: string;
  categorySlug: string;
};

/**
 * Enriched product type used by interactive components (e.g. ProductCard).
 * Extends the display-only ProductCard with numeric pricing and inventory data
 * required for cart integration and stock indicators.
 */
export type Product = ProductCard & {
  pricePerSqft: number;
  finish: string;
  stockSqft: number;
};

export type CategoryCard = {
  name: string;
  slug: string;
  items: number;
  image: string;
};

type RawCatalogCategory = {
  slug: string;
  name: string;
  image: string;
};

type RawCatalogProduct = {
  id: string;
  sku: string;
  name: string;
  dimensions: string;
  pricePerSqFt: number;
  image: string;
  categorySlug: string;
  featured: boolean;
  finish: string;
  application: string;
  stockSqFt: number;
};

export type RawCatalogPayload = {
  categories: RawCatalogCategory[];
  products: RawCatalogProduct[];
};

export type CatalogViewModel = {
  featuredProducts: Product[];
  allProducts: Product[];
  categories: CategoryCard[];
};

type CatalogLoadOptions = {
  remote?: boolean;
};

const UNKNOWN_CATEGORY_IMAGE = "/images/landing_hero.jpg";
const FALLBACK_CATALOG = catalogSeed as RawCatalogPayload;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isRawCatalogCategory(value: unknown): value is RawCatalogCategory {
  return (
    isRecord(value) &&
    typeof value.slug === "string" &&
    typeof value.name === "string" &&
    typeof value.image === "string"
  );
}

function isRawCatalogProduct(value: unknown): value is RawCatalogProduct {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.sku === "string" &&
    typeof value.name === "string" &&
    typeof value.dimensions === "string" &&
    typeof value.pricePerSqFt === "number" &&
    typeof value.image === "string" &&
    typeof value.categorySlug === "string" &&
    typeof value.featured === "boolean" &&
    typeof value.finish === "string" &&
    typeof value.application === "string" &&
    typeof value.stockSqFt === "number"
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isRawCatalogPayload(value: unknown): value is RawCatalogPayload {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Array.isArray(value.categories) &&
    value.categories.every(isRawCatalogCategory) &&
    Array.isArray(value.products) &&
    value.products.every(isRawCatalogProduct)
  );
}

function formatPrice(pricePerSqFt: number): string {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(pricePerSqFt);
}

function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * Live Supabase Catalog Fetcher
 * Academic Note: By transitioning from static JSON files to querying a live PostgreSQL database,
 * this function transforms the e-commerce platform from a passive content renderer into an 
 * active transactional system. It ensures that any frontend requests for catalog data reflect
 * the live state of inventory, pricing, and active categories, laying the foundation for our
 * transaction engine to accurately validate stock before deduction.
 */
async function fetchLiveSupabaseCatalog(): Promise<RawCatalogPayload | null> {
  try {
    // During Vercel build-time prerendering, env vars may not be available.
    // Gracefully return null so getCatalogData falls back to the static seed.
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return null;
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Use a 5-second timeout so the page falls back quickly if Supabase is unreachable.
    const timeout = AbortSignal.timeout(5000);

    // Fetch live categories and products concurrently
    const [categoriesRes, productsRes] = await Promise.all([
      supabase.from("categories").select("*").abortSignal(timeout),
      supabase.from("products").select("*").abortSignal(timeout),
    ]);

    if (categoriesRes.error || productsRes.error) {
      console.warn("Live database query error:", categoriesRes.error || productsRes.error);
      return null;
    }

    if (!categoriesRes.data || !productsRes.data) {
      return null;
    }

    // Map the relational rows (snake_case) to our TypeScript payload interface (camelCase)
    const payload: RawCatalogPayload = {
      categories: categoriesRes.data.map((row) => ({
        slug: row.slug,
        name: row.name,
        image: row.image,
      })),
      products: productsRes.data.map((row) => ({
        id: row.id,
        sku: row.sku,
        name: row.name,
        dimensions: row.dimensions,
        pricePerSqFt: row.price_per_sqft,
        image: row.image,
        categorySlug: row.category_slug,
        featured: row.featured,
        finish: row.finish,
        application: row.application,
        stockSqFt: row.stock_sqft,
      })),
    };

    return payload;
  } catch (err) {
    console.error("Failed to connect to live catalog database:", err);
    return null;
  }
}

export async function getRawCatalogPayload(
  options: CatalogLoadOptions = {}
): Promise<RawCatalogPayload> {
  const shouldUseRemote = options.remote ?? true;

  if (!shouldUseRemote) {
    return FALLBACK_CATALOG;
  }

  // Attempt to fetch from the live, dynamic PostgreSQL database.
  const liveCatalog = await fetchLiveSupabaseCatalog();
  
  // Safety Fallback Mechanism: If the live database is unreachable or returns an error,
  // we gracefully degrade to the static seed file to ensure the application UI remains stable.
  return liveCatalog ?? FALLBACK_CATALOG;
}

export async function getCatalogData(): Promise<CatalogViewModel> {
  const payload = await getRawCatalogPayload();
  const categoryLookup = new Map(
    payload.categories.map((category) => [category.slug, category])
  );

  const allProducts = payload.products.map((product) => {
    const category = categoryLookup.get(product.categorySlug);

    return {
      id: product.id,
      name: product.name,
      dimensions: product.dimensions,
      price: formatPrice(product.pricePerSqFt),
      image: product.image,
      category: category?.name ?? humanizeSlug(product.categorySlug),
      categorySlug: product.categorySlug,
      pricePerSqft: product.pricePerSqFt,
      finish: product.finish,
      stockSqft: product.stockSqFt,
    };
  });

  const featuredProducts = payload.products
    .filter((product) => product.featured)
    .map((product) => {
      const category = categoryLookup.get(product.categorySlug);

      return {
        id: product.id,
        name: product.name,
        dimensions: product.dimensions,
        price: formatPrice(product.pricePerSqFt),
        image: product.image,
        category: category?.name ?? humanizeSlug(product.categorySlug),
        categorySlug: product.categorySlug,
        pricePerSqft: product.pricePerSqFt,
        finish: product.finish,
        stockSqft: product.stockSqFt,
      };
    });

  const categories = payload.categories.map((category) => ({
    name: category.name,
    slug: category.slug,
    items: payload.products.filter(
      (product) => product.categorySlug === category.slug
    ).length,
    image: category.image || UNKNOWN_CATEGORY_IMAGE,
  }));

  return {
    featuredProducts,
    allProducts,
    categories,
  };
}
