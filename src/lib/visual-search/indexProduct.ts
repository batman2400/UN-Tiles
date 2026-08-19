import fs from "fs/promises";
import path from "path";
import { createAdminClient } from "@/utils/supabase/admin";
import { processImageInput } from "./image-input";
import { embedImage } from "./gemini-embeddings";
import type { IndexProductResult } from "./types";

/**
 * Indexes or re-indexes a single product's image embedding into the Supabase product_embeddings table.
 *
 * @param productId Product ID (e.g. "tile-floor-1")
 * @param imageUrl Relative public path (e.g. "/tiles/floor_agaria.jpg") or absolute HTTP URL
 * @param force If true, skips the cache check and forces re-embedding
 */
export async function indexProduct(
  productId: string,
  imageUrl: string,
  force = false
): Promise<IndexProductResult> {
  if (!productId || !imageUrl) {
    return {
      success: false,
      productId: productId || "unknown",
      status: "failed",
      message: "Missing productId or imageUrl.",
    };
  }

  const supabase = createAdminClient();

  // 1. Check if already indexed with the same image and model
  if (!force) {
    const { data: existing, error: checkError } = await supabase
      .from("product_embeddings")
      .select("image_url, model")
      .eq("product_id", productId)
      .maybeSingle();

    if (!checkError && existing && existing.image_url === imageUrl && existing.model === "gemini-embedding-2") {
      return {
        success: true,
        productId,
        status: "skipped",
        message: "Image URL unchanged; existing embedding is valid.",
      };
    }
  }

  // 2. Fetch or load image buffer
  let rawBuffer: Buffer;
  try {
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch remote image: HTTP ${response.status} ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      rawBuffer = Buffer.from(arrayBuffer);
    } else {
      // Local static image in public/
      const cleanPath = imageUrl.startsWith("/") ? imageUrl.slice(1) : imageUrl;
      const fullPath = path.join(process.cwd(), "public", cleanPath);
      rawBuffer = await fs.readFile(fullPath);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "File read error";
    return {
      success: false,
      productId,
      status: "failed",
      message: `Could not load image (${imageUrl}): ${message}`,
    };
  }

  // 3. Process & normalize with Sharp
  let processed;
  try {
    processed = await processImageInput(rawBuffer);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Sharp error";
    return {
      success: false,
      productId,
      status: "failed",
      message: `Image processing error: ${message}`,
    };
  }

  // 4. Generate 768-d Gemini embedding
  let embedding: number[];
  try {
    embedding = await embedImage(processed.buffer, processed.mimeType);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Embedding generation failed";
    return {
      success: false,
      productId,
      status: "failed",
      message: `Gemini embedding error: ${message}`,
    };
  }

  // 5. Upsert to Supabase pgvector table
  const { error: upsertError } = await supabase
    .from("product_embeddings")
    .upsert({
      product_id: productId,
      embedding: JSON.stringify(embedding),
      model: "gemini-embedding-2",
      image_url: imageUrl,
      updated_at: new Date().toISOString(),
    });

  if (upsertError) {
    return {
      success: false,
      productId,
      status: "failed",
      message: `Database upsert error: ${upsertError.message}`,
    };
  }

  return {
    success: true,
    productId,
    status: "indexed",
  };
}
