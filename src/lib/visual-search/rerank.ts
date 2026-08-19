import { cosineSimilarity } from "./cosine";
import { isHistogram } from "./color-histogram";
import { MATCH_RESULT_COUNT } from "./constants";

export type EmbeddingHit = {
  product_id: string;
  similarity: number;
};

/**
 * Blend embedding cosine with a colour histogram cosine.
 * Falls back to embedding-only order when a histogram is missing.
 */
export function rerankByColor(
  hits: EmbeddingHit[],
  histograms: Map<string, number[]>,
  queryHistogram: number[] | null,
  colorWeight: number,
  take = MATCH_RESULT_COUNT
): EmbeddingHit[] {
  if (!queryHistogram || hits.length === 0) {
    return hits.slice(0, take);
  }

  const embeddingWeight = 1 - colorWeight;
  const scored = hits.map((hit) => {
    const hist = histograms.get(hit.product_id);
    const colorSim =
      hist && isHistogram(hist) ? Math.max(0, cosineSimilarity(queryHistogram, hist)) : 0;
    const embeddingSim = Math.max(0, Math.min(1, hit.similarity));
    const rankScore =
      hist && isHistogram(hist)
        ? embeddingWeight * embeddingSim + colorWeight * colorSim
        : embeddingSim;
    return { hit, rankScore };
  });

  scored.sort((a, b) => b.rankScore - a.rankScore);
  return scored.slice(0, take).map((row) => row.hit);
}
