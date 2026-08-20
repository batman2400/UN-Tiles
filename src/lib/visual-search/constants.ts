/** Gemini Embedding 2 checkpoint. Must match seed, Matcher, and Scene Advisor. */
export const EMBEDDING_MODEL = "gemini-embedding-2";

/**
 * Stored in product_embeddings.model. Bump this when the embed prompt or
 * preprocessing changes so incremental reindex rewrites stale vectors.
 */
export const EMBEDDING_VERSION = "gemini-embedding-2:v3";

export const OUTPUT_DIMENSIONALITY = 768;

/** Pull extra neighbours, then re-rank with colour before showing this many. */
export const MATCH_CANDIDATE_COUNT = 32;
export const MATCH_RESULT_COUNT = 16;

/** Blend weight for colour histogram vs embedding cosine (Matcher). */
export const MATCHER_COLOR_WEIGHT = 0.12;

/** Blend weight for scene palette vs embedding cosine (Scene Advisor). */
export const SCENE_PALETTE_WEIGHT = 0.15;

export const HUE_BINS = 16;
export const SAT_BINS = 8;
export const VAL_BINS = 8;
export const HISTOGRAM_BINS = HUE_BINS + SAT_BINS + VAL_BINS;
