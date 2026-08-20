import { isVisionConfigured } from "@/lib/visual-search/gemini-scene";
import { VisualSearchClient } from "./VisualSearchClient";

export const dynamic = "force-dynamic";

export default function VisualSearchPage() {
  return <VisualSearchClient visionEnabled={isVisionConfigured()} />;
}
