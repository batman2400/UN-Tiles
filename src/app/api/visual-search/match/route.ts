import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/visual-search/rate-limit";
import { processImageInput } from "@/lib/visual-search/image-input";
import { embedImage } from "@/lib/visual-search/gemini-embeddings";
import { createAdminClient } from "@/utils/supabase/admin";
import { getCatalogData } from "@/data/products";
import { publicErrorMessage } from "@/lib/visual-search/public-error";
import type { MatchedProduct } from "@/lib/visual-search/types";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  // 1. IP Rate Limiting (~10 req/min)
  const rateLimit = checkRateLimit(req, 10, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: "Rate limit exceeded. Please wait a moment before trying again.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil(rateLimit.resetMs / 1000).toString(),
        },
      }
    );
  }

  try {
    // 2. Extract image from request (multipart/form-data or JSON)
    let fileBuffer: Buffer | null = null;

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = (formData.get("image") || formData.get("file")) as File | null;
      if (!file) {
        return NextResponse.json(
          { success: false, error: "No image file provided in request." },
          { status: 400 }
        );
      }
      const arrayBuf = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuf);
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      if (body.image || body.base64) {
        const rawBase64 = (body.image || body.base64).replace(/^data:image\/\w+;base64,/, "");
        fileBuffer = Buffer.from(rawBase64, "base64");
      }
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing image upload." },
        { status: 400 }
      );
    }

    // 3. Normalize image format with Sharp
    const processed = await processImageInput(fileBuffer);

    // 4. Generate 768-d normalized vector with Gemini Embedding 2 (Key A)
    const embedding = await embedImage(processed.buffer, processed.mimeType);

    // 5. Query Supabase vector similarity RPC
    const supabase = createAdminClient();
    const { data: rpcRows, error: rpcError } = await supabase.rpc("match_product_embeddings", {
      query_embedding: JSON.stringify(embedding),
      match_count: 8,
      similarity_threshold: 0.0,
    });

    if (rpcError) {
      console.error("[Visual Match API] RPC Error:", rpcError);
      return NextResponse.json(
        { success: false, error: "Database matching query failed." },
        { status: 500 }
      );
    }

    // 6. Enrich with catalog product metadata
    const { allProducts } = await getCatalogData();
    const productMap = new Map(allProducts.map((p) => [p.id, p]));

    const matches: MatchedProduct[] = [];
    for (const row of rpcRows || []) {
      const product = productMap.get(row.product_id);
      if (product) {
        const rawSim = Math.max(0, Math.min(1, Number(row.similarity)));
        matches.push({
          ...product,
          similarity: rawSim,
          similarityPercentage: Math.round(rawSim * 100),
        });
      }
    }

    const queryTimeMs = Date.now() - startTime;
    return NextResponse.json({
      success: true,
      matches,
      queryTimeMs,
    });
  } catch (err: unknown) {
    console.error("[Visual Match API] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: publicErrorMessage(err, "Could not match this image. Please try another photo."),
      },
      { status: 500 }
    );
  }
}
