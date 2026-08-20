import { createAdminClient } from "@/utils/supabase/admin";
import { getCatalogDataUncached, type Product } from "@/data/products";
import { histogramForImageUrl, isHistogram } from "./color-histogram";
import { MATCH_CANDIDATE_COUNT, MATCH_RESULT_COUNT } from "./constants";
import { rerankByColor } from "./rerank";
import type { MatchedProduct } from "./types";

type RpcRow = {
  product_id: string;
  similarity: number;
};

async function fetchStoredHistograms(productIds: string[]): Promise<Map<string, number[]>> {
  const map = new Map<string, number[]>();
  if (productIds.length === 0) return map;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("product_embeddings")
      .select("product_id, color_histogram")
      .in("product_id", productIds);

    if (error || !data) return map;

    for (const row of data) {
      if (typeof row.product_id === "string" && isHistogram(row.color_histogram)) {
        map.set(row.product_id, row.color_histogram);
      }
    }
  } catch {
    // Column may be missing until migration 021 — compute from files instead.
  }

  return map;
}

async function fillHistogramsFromCatalog(
  productIds: string[],
  productMap: Map<string, Product>,
  existing: Map<string, number[]>
): Promise<Map<string, number[]>> {
  const missing = productIds.filter((id) => !existing.has(id));
  await Promise.all(
    missing.map(async (id) => {
      const image = productMap.get(id)?.image;
      if (!image) return;
      const histogram = await histogramForImageUrl(image);
      if (histogram) existing.set(id, histogram);
    })
  );
  return existing;
}

function toMatchedProducts(
  hits: { product_id: string; similarity: number }[],
  productMap: Map<string, Product>
): MatchedProduct[] {
  const matches: MatchedProduct[] = [];
  for (const hit of hits) {
    const product = productMap.get(hit.product_id);
    if (!product) continue;
    const rawSim = Math.max(0, Math.min(1, Number(hit.similarity)));
    matches.push({
      ...product,
      similarity: rawSim,
      similarityPercentage: Math.round(rawSim * 100),
    });
  }
  return matches;
}

/**
 * Cosine k-NN, then optional colour re-rank of the neighbour list.
 */
export async function retrieveCatalogMatches(
  queryEmbedding: number[],
  options?: {
    queryHistogram?: number[] | null;
    colorWeight?: number;
    take?: number;
    excludeCategories?: string[];
    allowedCategories?: string[];
  }
): Promise<MatchedProduct[]> {
  const take = options?.take ?? MATCH_RESULT_COUNT;
  const supabase = createAdminClient();
  const { data: rpcRows, error: rpcError } = await supabase.rpc("match_product_embeddings", {
    query_embedding: JSON.stringify(queryEmbedding),
    match_count: MATCH_CANDIDATE_COUNT,
    similarity_threshold: 0.0,
  });

  if (rpcError) {
    throw new Error(`Database matching query failed: ${rpcError.message}`);
  }

  const { allProducts } = await getCatalogDataUncached();
  const productMap = new Map(allProducts.map((p) => [p.id, p]));

  let hits = ((rpcRows || []) as RpcRow[]).map((row) => ({
    product_id: row.product_id,
    similarity: Number(row.similarity),
  }));

  // Filter out excluded categories (e.g. pool-tiles in residential rooms)
  if (options?.excludeCategories && options.excludeCategories.length > 0) {
    const excludeSet = new Set(options.excludeCategories);
    const excludePool = excludeSet.has("pool-tiles");
    hits = hits.filter((hit) => {
      const prod = productMap.get(hit.product_id);
      if (!prod) return true;
      if (excludeSet.has(prod.categorySlug)) return false;
      if (excludePool && /\bpool\b/i.test(`${prod.id} ${prod.name} ${prod.categorySlug}`)) {
        return false;
      }
      return true;
    });
  }

  // Filter for allowed categories if specified
  if (options?.allowedCategories && options.allowedCategories.length > 0) {
    const allowedSet = new Set(options.allowedCategories);
    hits = hits.filter((hit) => {
      const prod = productMap.get(hit.product_id);
      return prod ? allowedSet.has(prod.categorySlug) : true;
    });
  }

  let histograms = new Map<string, number[]>();
  if (options?.queryHistogram && (options.colorWeight ?? 0) > 0) {
    histograms = await fetchStoredHistograms(hits.map((h) => h.product_id));
    histograms = await fillHistogramsFromCatalog(
      hits.map((h) => h.product_id),
      productMap,
      histograms
    );
  }

  const ranked = rerankByColor(
    hits,
    histograms,
    options?.queryHistogram ?? null,
    options?.colorWeight ?? 0,
    take
  );

  return toMatchedProducts(ranked, productMap);
}

