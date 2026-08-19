import { GoogleGenAI } from "@google/genai";
import { normalizeVector } from "./cosine";

const EMBEDDING_MODEL = "gemini-embedding-2";
const OUTPUT_DIMENSIONALITY = 768;

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

/**
 * Generates a 768-dimensional L2-normalized vector embedding for an image buffer.
 */
export async function embedImage(
  imageBuffer: Buffer,
  mimeType: string = "image/jpeg"
): Promise<number[]> {
  const ai = getEmbedClient();
  const base64Data = imageBuffer.toString("base64");

  return withRetry(async () => {
    const response = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: [
        {
          inlineData: {
            mimeType: mimeType as string,
            data: base64Data,
          },
        },
      ],
      config: {
        outputDimensionality: OUTPUT_DIMENSIONALITY,
      },
    });

    const values = response.embeddings?.[0]?.values;
    if (!values || values.length === 0) {
      throw new Error("Gemini Embeddings API returned an empty embedding vector for image.");
    }

    return normalizeVector(values);
  });
}

/**
 * Generates a 768-dimensional L2-normalized vector embedding for a text query.
 */
export async function embedText(text: string): Promise<number[]> {
  const ai = getEmbedClient();
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Cannot embed empty text string.");
  }

  return withRetry(async () => {
    const response = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: trimmed,
      config: {
        outputDimensionality: OUTPUT_DIMENSIONALITY,
      },
    });

    const values = response.embeddings?.[0]?.values;
    if (!values || values.length === 0) {
      throw new Error("Gemini Embeddings API returned an empty embedding vector for text.");
    }

    return normalizeVector(values);
  });
}
