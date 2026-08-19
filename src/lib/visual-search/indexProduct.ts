import fs from "fs/promises";
import path from "path";
import { createAdminClient } from "@/utils/supabase/admin";
import { getRawCatalogPayload } from "@/data/products";
import { processImageInput } from "./image-input";
import { embedCatalogDocument } from "./gemini-embeddings";
import { computeColorHistogram } from "./color-histogram";
import { EMBEDDING_VERSION } from "./constants";
import type { IndexProductResult } from "./types";

function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function resolveDocumentCaption(productId: string): Promise<{ title: string; text: string }> {
  try {
    const payload = await getRawCatalogPayload();
    const product = payload.products.find((p) => p.id === productId);
    if (!product) {
      return { title: productId, text: "ceramic tile" };
    }
    const categoryName =
      payload.categories.find((c) => c.slug === product.categorySlug)?.name ||
      humanizeSlug(product.categorySlug);
    const text = [
      categoryName,
      product.finish ? `${product.finish} finish` : null,
      product.application ? `${product.application} use` : null,
      product.dimensions || null,
      "ceramic porcelain tile",
    ]
      .filter(Boolean)
      .join(". ");
    return { title: product.name, text };
  } catch {
    return { title: productId, text: "ceramic tile" };
  }
}

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

  // 1. Check if already indexed with the same image and embedding version
  if (!force) {
    const { data: existing, error: checkError } = await supabase
      .from("product_embeddings")
      .select("image_url, model")
      .eq("product_id", productId)
      .maybeSingle();

    if (
      !checkError &&
      existing &&
      existing.image_url === imageUrl &&
      existing.model === EMBEDDING_VERSION
    ) {
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

  // 3. Process & normalize with Sharp (same framing as Tile Matcher queries)
  let processed;
  try {
    processed = await processImageInput(rawBuffer, { purpose: "match" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Sharp error";
    return {
      success: false,
      productId,
      status: "failed",
      message: `Image processing error: ${message}`,
    };
  }

  const caption = await resolveDocumentCaption(productId);

  // 4. Generate 768-d Gemini document embedding (title + text + image)
  let embedding: number[];
  try {
    embedding = await embedCatalogDocument(
      processed.buffer,
      processed.mimeType,
      caption.title,
      caption.text
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Embedding generation failed";
    return {
      success: false,
      productId,
      status: "failed",
      message: `Gemini embedding error: ${message}`,
    };
  }

  let colorHistogram: number[] | null = null;
  try {
    colorHistogram = await computeColorHistogram(processed.buffer);
  } catch (err: unknown) {
    console.warn(`[visual-search] Histogram failed for ${productId}; embedding only.`, err);
  }

  // 5. Upsert to Supabase pgvector table
  const baseRow = {
    product_id: productId,
    embedding: JSON.stringify(embedding),
    model: EMBEDDING_VERSION,
    image_url: imageUrl,
    updated_at: new Date().toISOString(),
  };

  let upsertError: { message: string } | null = null;
  if (colorHistogram) {
    const { error } = await supabase.from("product_embeddings").upsert({
      ...baseRow,
      color_histogram: colorHistogram,
    });
    upsertError = error;
    // Column missing until migration 021 is applied — fall back to embedding-only upsert.
    if (error && /color_histogram/i.test(error.message)) {
      const fallback = await supabase.from("product_embeddings").upsert(baseRow);
      upsertError = fallback.error;
    }
  } else {
    const { error } = await supabase.from("product_embeddings").upsert(baseRow);
    upsertError = error;
  }

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
