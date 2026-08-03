import catalogSeed from "./catalog.json";

export type ProductCard = {
  id: string;
  name: string;
  dimensions: string;
  price: string;
  image: string;
  category: string;
  categorySlug: string;
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
  featuredProducts: ProductCard[];
  allProducts: ProductCard[];
  categories: CategoryCard[];
};

type CatalogLoadOptions = {
  remote?: boolean;
};

const CACHE_SECONDS = 300;
const UNKNOWN_CATEGORY_IMAGE = "/images/landing_hero.png";
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
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(pricePerSqFt);
}

function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function fetchRemoteCatalog(url: string): Promise<RawCatalogPayload | null> {
  try {
    const response = await fetch(url, {
      next: { revalidate: CACHE_SECONDS },
    });

    if (!response.ok) {
      return null;
    }

    const payload: unknown = await response.json();
    return isRawCatalogPayload(payload) ? payload : null;
  } catch {
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

  const remoteUrl = process.env.UN_TILES_API_URL;
  if (!remoteUrl) {
    return FALLBACK_CATALOG;
  }

  const remoteCatalog = await fetchRemoteCatalog(remoteUrl);
  return remoteCatalog ?? FALLBACK_CATALOG;
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
