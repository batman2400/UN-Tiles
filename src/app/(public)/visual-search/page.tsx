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
  return <VisualSearchClient visionEnabled={isVisionConfigured()} />;
}
