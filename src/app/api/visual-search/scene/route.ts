import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/visual-search/rate-limit";
import { processImageInput } from "@/lib/visual-search/image-input";
import { analyzeScene, isVisionConfigured } from "@/lib/visual-search/gemini-scene";
import { embedText } from "@/lib/visual-search/gemini-embeddings";
import { createAdminClient } from "@/utils/supabase/admin";
import { getCatalogDataUncached } from "@/data/products";
import { publicErrorMessage } from "@/lib/visual-search/public-error";
import type { MatchedProduct, SceneBrief } from "@/lib/visual-search/types";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  if (!isVisionConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: "Scene Advisor is not enabled yet. Tile Matcher is available now.",
      },
      { status: 503 }
    );
  }

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
    // 2. Extract room image
    let fileBuffer: Buffer | null = null;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = (formData.get("image") || formData.get("file")) as File | null;
      if (!file) {
        return NextResponse.json(
          { success: false, error: "No room photo provided in request." },
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
        { success: false, error: "Invalid or missing room image." },
        { status: 400 }
      );
    }

    // 3. Process & normalize image format
    const processed = await processImageInput(fileBuffer);

    // 4. Generate structured architectural brief with Gemini 2.5 Flash Vision (Key B)
    let scene: SceneBrief;
    try {
      scene = await analyzeScene(processed.buffer, processed.mimeType);
    } catch (visionErr: unknown) {
      console.error("[Scene Advisor API] Vision Analysis Error:", visionErr);
      return NextResponse.json(
        {
          success: false,
          error: publicErrorMessage(visionErr, "Could not analyse this room photo. Please try another image."),
        },
        { status: 500 }
      );
    }

    // 5. Embed idealTileQuery with Gemini Embedding 2 (Key A)
    const matches: MatchedProduct[] = [];
    try {
      const textEmbedding = await embedText(scene.idealTileQuery);

      // 6. Query catalog image vectors using the text embedding
      const supabase = createAdminClient();
      const { data: rpcRows, error: rpcError } = await supabase.rpc("match_product_embeddings", {
        query_embedding: JSON.stringify(textEmbedding),
        match_count: 8,
        similarity_threshold: 0.0,
      });

      if (!rpcError && rpcRows) {
        const { allProducts } = await getCatalogDataUncached();
        const productMap = new Map(allProducts.map((p) => [p.id, p]));

        for (const row of rpcRows) {
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
      }
    } catch (embedErr: unknown) {
      // Graceful fallback: If text embed fails, we still return the Scene Brief!
      console.warn("[Scene Advisor API] Text embedding / DB retrieval failed, returning brief only:", embedErr);
    }

    const queryTimeMs = Date.now() - startTime;
    return NextResponse.json({
      success: true,
      scene,
      matches,
      queryTimeMs,
    });
  } catch (err: unknown) {
    console.error("[Scene Advisor API] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: publicErrorMessage(err, "Could not analyse this room photo. Please try another image."),
      },
      { status: 500 }
    );
  }
}
