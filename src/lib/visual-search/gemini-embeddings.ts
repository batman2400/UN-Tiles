import { GoogleGenAI } from "@google/genai";
import { normalizeVector } from "./cosine";
import { EMBEDDING_MODEL, OUTPUT_DIMENSIONALITY } from "./constants";

function getEmbedClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_EMBED_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing GEMINI_EMBED_API_KEY environment variable. " +
        "Please set GEMINI_EMBED_API_KEY in your .env.local or deployment environment."
    );
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Utility to retry an async function on 429 (Resource Exhausted) or temporary network errors with exponential backoff.
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, initialDelayMs = 1000): Promise<T> {
  let delay = initialDelayMs;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const errObj = error as { status?: number; message?: string } | undefined;
      const isRateLimit =
        errObj?.status === 429 ||
        errObj?.message?.includes("429") ||
        errObj?.message?.toLowerCase().includes("quota") ||
        errObj?.message?.toLowerCase().includes("resource exhausted") ||
        errObj?.message?.toLowerCase().includes("rate limit");

      if (attempt === maxRetries || !isRateLimit) {
        throw error;
      }

      console.warn(`[Gemini Embeddings] Rate limited (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  throw new Error("Failed after retries");
}

type EmbedPart =
  | string
  | {
      inlineData: {
        mimeType: string;
        data: string;
      };
    };

async function embedParts(contents: EmbedPart[]): Promise<number[]> {
  const ai = getEmbedClient();

  return withRetry(async () => {
    const response = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents,
      config: {
        outputDimensionality: OUTPUT_DIMENSIONALITY,
      },
    });

    const values = response.embeddings?.[0]?.values;
    if (!values || values.length === 0) {
      throw new Error("Gemini Embeddings API returned an empty embedding vector.");
    }

    return normalizeVector(values);
  });
}

function imagePart(imageBuffer: Buffer, mimeType: string): EmbedPart {
  return {
    inlineData: {
      mimeType,
      data: imageBuffer.toString("base64"),
    },
  };
}

/**
 * Catalog document: title/text prefix + product photo.
 * Gemini Embedding 2 does not support taskType; prefixes go in the prompt.
 */
export async function embedCatalogDocument(
  imageBuffer: Buffer,
  mimeType: string,
  title: string,
  text: string
): Promise<number[]> {
  const safeTitle = title.trim() || "none";
  const safeText = text.trim() || "ceramic tile";
  return embedParts([`title: ${safeTitle} | text: ${safeText}`, imagePart(imageBuffer, mimeType)]);
}

/**
 * Tile Matcher query: search-result prefix + user photo (same space as catalog documents).
 */
export async function embedQueryImage(
  imageBuffer: Buffer,
  mimeType: string = "image/jpeg"
): Promise<number[]> {
  return embedParts([
    "task: search result | query: catalog tile that matches this photo",
    imagePart(imageBuffer, mimeType),
  ]);
}

/**
 * Scene Advisor query: search-result prefix around the ideal-tile sentence.
 */
export async function embedQueryText(text: string): Promise<number[]> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Cannot embed empty text string.");
  }
  return embedParts([`task: search result | query: ${trimmed}`]);
}
