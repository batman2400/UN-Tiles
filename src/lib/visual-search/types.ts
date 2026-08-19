import type { Product } from "@/data/products";

export interface SceneBrief {
  roomType: string;
  lighting: string;
  palette: string[];
  styleTags: string[];
  surfaces: string;
  idealTileQuery: string;
}

export type MatchedProduct = Product & {
  similarity: number;
  similarityPercentage: number;
};

export interface TileMatcherResponse {
  success: boolean;
  matches: MatchedProduct[];
  queryTimeMs: number;
  error?: string;
}

export interface SceneAdvisorResponse {
  success: boolean;
  scene?: SceneBrief;
  matches: MatchedProduct[];
  queryTimeMs: number;
  error?: string;
}

export interface IndexProductResult {
  success: boolean;
  productId: string;
  status: "indexed" | "skipped" | "failed";
  message?: string;
}

export interface ReindexResponse {
  success: boolean;
  result: IndexProductResult;
}
