import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/visual-search/rate-limit";
import {
  ImageValidationError,
  MAX_IMAGE_SIZE_BYTES,
  processImageInput,
} from "@/lib/visual-search/image-input";
import { analyzeScene, isVisionConfigured } from "@/lib/visual-search/gemini-scene";
import { embedQueryText } from "@/lib/visual-search/gemini-embeddings";
import { histogramFromPalette } from "@/lib/visual-search/color-histogram";
import { retrieveCatalogMatches } from "@/lib/visual-search/retrieve";
import {
  buildSceneSearchQuery,
  resolveSceneCatalogFilter,
} from "@/lib/visual-search/scene-filters";
import { SCENE_PALETTE_WEIGHT } from "@/lib/visual-search/constants";
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

  // 1. IP Rate Limiting (10 req/min)
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
      const rawEntry = formData.get("image") || formData.get("file");
      if (!(rawEntry instanceof File)) {
        return NextResponse.json(
          { success: false, error: "No room photo provided in request." },
          { status: 400 }
        );
      }
      if (rawEntry.size > MAX_IMAGE_SIZE_BYTES) {
        return NextResponse.json(
          { success: false, error: "Image exceeds the 4.5MB size limit." },
          { status: 413 }
        );
      }
      const arrayBuf = await rawEntry.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuf);
    } else if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => null);
      if (!body || typeof body !== "object") {
        return NextResponse.json(
          { success: false, error: "Invalid JSON payload." },
          { status: 400 }
        );
      }
      const rawImage = body.image ?? body.base64;
      if (typeof rawImage !== "string") {
        return NextResponse.json(
          { success: false, error: "Invalid or missing room image." },
          { status: 400 }
        );
      }
      const rawBase64 = rawImage.replace(/^data:image\/\w+;base64,/, "");
      if (rawBase64.length > Math.ceil(MAX_IMAGE_SIZE_BYTES * 1.4)) {
        return NextResponse.json(
          { success: false, error: "Image exceeds the 4.5MB size limit." },
          { status: 413 }
        );
      }
      fileBuffer = Buffer.from(rawBase64, "base64");
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing room image." },
        { status: 400 }
      );
    }

    // 3. Process & normalize image format (full frame for Vision)
    const processed = await processImageInput(fileBuffer, { purpose: "scene" });

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

    // 5. Embed idealTileQuery with Gemini Embedding 2 (Key A) and re-rank by palette
    let matches: MatchedProduct[] = [];
    try {
      const catalogFilter = resolveSceneCatalogFilter(scene);
      const textEmbedding = await embedQueryText(buildSceneSearchQuery(scene));
      matches = await retrieveCatalogMatches(textEmbedding, {
        queryHistogram: histogramFromPalette(scene.palette),
        colorWeight: SCENE_PALETTE_WEIGHT,
        allowedCategories: catalogFilter.allowedCategories,
        excludeCategories: catalogFilter.excludeCategories,
      });
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
    if (err instanceof ImageValidationError) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: err.status }
      );
    }
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
