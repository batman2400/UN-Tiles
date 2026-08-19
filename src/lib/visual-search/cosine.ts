/**
 * Normalizes a vector to unit length (L2 norm).
 * Used to ensure all 768-d embeddings are normalized prior to insertion and querying.
 */
export function normalizeVector(vector: number[]): number[] {
  let sumSq = 0;
  for (let i = 0; i < vector.length; i++) {
    sumSq += vector[i] * vector[i];
  }

  const norm = Math.sqrt(sumSq);
  if (norm === 0) {
    return vector;
  }

  return vector.map((val) => val / norm);
}

/**
 * Calculates cosine similarity between two unit vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }

  let dotProduct = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
  }
  return dotProduct;
}
