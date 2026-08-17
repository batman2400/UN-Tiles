import { preload } from "react-dom";
import type { Metadata } from "next";
import { getCatalogData } from "@/data/products";
import { PlannerClient } from "./PlannerClient";

export const metadata: Metadata = {
  title: "Smart Tile Planner | UN Tiles",
  description:
    "Plan a rectangle or L-shaped room, preview tile cuts and waste, and add the recommended square footage to your cart.",
};

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  preload("/images/contact_hero_v6.jpg", { as: "image", fetchPriority: "high" });
  const [{ allProducts }, params] = await Promise.all([getCatalogData(), searchParams]);

  return <PlannerClient products={allProducts} initialProductId={params.product} />;
}
