import { getCatalogData } from "@/data/products";
import { CollectionsClient } from "./CollectionsClient";
import { preload } from "react-dom";

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
  preload("/images/contact_hero_v6.jpg", { as: "image", fetchPriority: "high" });

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
    ? (Array.isArray(resolvedSearchParams.q) ? resolvedSearchParams.q[0] : resolvedSearchParams.q)
    : "";

  return (
    <CollectionsClient
      allProducts={allProducts}
      categories={categories}
      initialCategory={categoryParam || ""}
      initialDims={dimParams}
      initialQuery={qParam || ""}
    />
  );
}
