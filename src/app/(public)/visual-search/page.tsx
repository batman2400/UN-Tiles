import type { Metadata } from "next";
import { isVisionConfigured } from "@/lib/visual-search/gemini-scene";
import { VisualSearchClient } from "./VisualSearchClient";

export const metadata: Metadata = {
  title: "AI Visual Tile Search",
  description:
    "Upload a photo of any space and let our AI find matching tiles from our collection. Powered by Gemini Vision for instant, accurate tile recommendations.",
  alternates: { canonical: "/visual-search" },
  openGraph: {
    title: "AI Visual Tile Search | UN Tiles",
    description:
      "Upload a photo and let AI find matching tiles instantly. Powered by Gemini Vision.",
    url: "https://www.untiles.com/visual-search",
  },
};

export const dynamic = "force-dynamic";

export default function VisualSearchPage() {
  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "UN Tiles AI Visual Search & Scene Advisor",
    url: "https://www.untiles.com/visual-search",
    applicationCategory: "DesignApplication",
    operatingSystem: "All",
    browserRequirements: "Requires modern web browser with camera or upload support",
    description:
      "Upload a photo of your room or inspiration tile swatch. Our Gemini AI analyzes palette, lighting, and architectural textures to recommend curated tile matches from our catalog.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "LKR",
    },
    featureList: [
      "AI Room Scene Styling Advisor",
      "Instant Tile Texture and Pattern Matching",
      "Architectural Palette and Surface Recommendations",
      "Curated Sourcing from Leading Global Tile Manufacturers",
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
        name: "AI Visual Search & Suggestions",
        item: "https://www.untiles.com/visual-search",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <VisualSearchClient visionEnabled={isVisionConfigured()} />
    </>
  );
}
