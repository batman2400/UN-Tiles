import type { Metadata } from "next";
import { isVisionConfigured } from "@/lib/visual-search/gemini-scene";
import { VisualSearchClient } from "./VisualSearchClient";

export const metadata: Metadata = {
  title: "AI Tiles Finder in Sri Lanka | Visual Tile Matcher & Design Advisor",
  description:
    "Sri Lanka's #1 AI Tiles Finder. Upload a photo of any room or tile texture and let our Gemini AI instantly find matching floor and wall tiles available to purchase in Sri Lanka with islandwide delivery.",
  keywords: [
    "ai tiles finder in sri lanka",
    "ai tile finder",
    "ai tiles finder",
    "tile visual search sri lanka",
    "find tiles with ai",
    "ai tile matcher colombo",
    "snap and find tiles sri lanka",
    "room tile visualizer sri lanka",
    "buy tiles in sri lanka",
  ],
  alternates: { canonical: "/visual-search" },
  openGraph: {
    title: "AI Tiles Finder in Sri Lanka | UN Tiles",
    description:
      "Upload a photo and let Sri Lanka's #1 AI Tiles Finder match floor and wall tiles instantly. Powered by Gemini AI.",
    url: "https://www.untiles.com/visual-search",
  },
};

export const dynamic = "force-dynamic";

export default function VisualSearchPage() {
  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Sri Lanka AI Tiles Finder - UN Tiles",
    url: "https://www.untiles.com/visual-search",
    applicationCategory: "DesignApplication",
    operatingSystem: "All",
    browserRequirements: "Requires modern web browser with camera or upload support",
    description:
      "Sri Lanka's #1 AI Tiles Finder. Upload a photo of your room or inspiration tile swatch to find matching floor and wall tiles with Gemini AI.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "LKR",
    },
    featureList: [
      "AI Tiles Finder in Sri Lanka",
      "Instant Tile Texture & Pattern Matching",
      "AI Room Scene Styling Advisor",
      "Direct Tile Purchasing with Islandwide Sri Lanka Delivery",
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is the best AI tiles finder in Sri Lanka?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "UN Tiles offers Sri Lanka's premier AI Tiles Finder, powered by Google Gemini Vision. Users can upload a photo of their space, swatch, or inspirational concept to instantly discover matching porcelain and ceramic tiles available in Sri Lanka with transparent LKR pricing.",
        },
      },
      {
        "@type": "Question",
        name: "How does the AI Tiles Finder match tiles?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Our AI model analyzes color palette, surface texture, glaze finish, and architectural lighting in your image, comparing it against high-dimensional vector embeddings of our live inventory in Sri Lanka.",
        },
      },
      {
        "@type": "Question",
        name: "Can I buy the tiles matched by the AI finder online in Sri Lanka?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, once the AI Tiles Finder recommends matching tiles, you can calculate the exact square footage needed using our Smart Planner, add them to your cart, and purchase online with islandwide delivery across Sri Lanka.",
        },
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
        name: "AI Tiles Finder in Sri Lanka",
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <VisualSearchClient visionEnabled={isVisionConfigured()} />
    </>
  );
}
