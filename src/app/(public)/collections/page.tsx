import { Suspense } from "react";
import { preload } from "react-dom";
import { getCatalogData } from "@/data/products";
import { CollectionsClient } from "./CollectionsClient";
import CollectionsLoading from "./loading";

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

  return (
    <CollectionsClient
      allProducts={allProducts}
      categories={categories}
    />
  );
}
