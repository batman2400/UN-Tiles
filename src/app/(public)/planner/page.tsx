import { preload } from "react-dom";
import type { Metadata } from "next";
import { getCatalogData } from "@/data/products";
import { PlannerClient } from "./PlannerClient";

export const metadata: Metadata = {
  title: "Smart Tile Planner",
  description:
    "Plan a rectangle or L-shaped room, preview tile cuts and waste, and add the recommended square footage to your cart. Free online tile calculator by UN Tiles.",
  alternates: { canonical: "/planner" },
  openGraph: {
    title: "Smart Tile Planner | UN Tiles",
    description:
      "Plan your room layout, preview tile cuts and waste, then order the exact quantity you need.",
    url: "https://www.untiles.com/planner",
  },
};

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  preload("/images/contact_hero_v6.jpg", { as: "image", fetchPriority: "high" });
  const [{ allProducts }, params] = await Promise.all([getCatalogData(), searchParams]);

  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Plan Your Tile Layout with UN Tiles Smart Planner",
    description:
      "Use our free online tile planner to calculate exactly how many tiles you need, preview cuts and waste, and add the right quantity to your cart.",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Select a tile",
        text: "Choose a tile from our collections or enter via the product page.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Enter room dimensions",
        text: "Input the length and width of your room. Supports rectangle and L-shaped layouts.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Preview the layout",
        text: "See a visual preview of how tiles will be laid out, including cuts and waste percentage.",
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Add to cart",
        text: "Add the recommended square footage (including waste buffer) directly to your cart.",
      },
    ],
    tool: [
      {
        "@type": "HowToTool",
        name: "UN Tiles Smart Planner (free online tool)",
      },
    ],
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
        name: "Smart Tile Planner",
        item: "https://www.untiles.com/planner",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <PlannerClient products={allProducts} initialProductId={params.product} />
    </>
  );
}
