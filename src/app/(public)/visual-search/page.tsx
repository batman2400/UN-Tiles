import { isVisionConfigured } from "@/lib/visual-search/gemini-scene";
import { VisualSearchClient } from "./VisualSearchClient";

export default function VisualSearchPage() {
  return <VisualSearchClient visionEnabled={isVisionConfigured()} />;
}
