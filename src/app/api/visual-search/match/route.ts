import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/visual-search/rate-limit";
import {
  ImageValidationError,
  MAX_IMAGE_SIZE_BYTES,
  processImageInput,
} from "@/lib/visual-search/image-input";
import { embedQueryImage } from "@/lib/visual-search/gemini-embeddings";
import { computeColorHistogram } from "@/lib/visual-search/color-histogram";
import { retrieveCatalogMatches } from "@/lib/visual-search/retrieve";
import { classifyTileCategory } from "@/lib/visual-search/gemini-scene";
import { MATCHER_COLOR_WEIGHT } from "@/lib/visual-search/constants";
import { publicErrorMessage } from "@/lib/visual-search/public-error";

export const maxDuration = 30;
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const startTime = Date.now();

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
    let fileBuffer: Buffer | null = null;
    let requestedCategory = "all";

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const rawEntry = formData.get("image") || formData.get("file");
      const rawCategory = formData.get("category");
      requestedCategory = typeof rawCategory === "string" ? rawCategory : "all";
      if (!(rawEntry instanceof File)) {
        return NextResponse.json(
          { success: false, error: "No image file provided in request." },
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
      requestedCategory = typeof body.category === "string" ? body.category : "all";
      const rawImage = body.image ?? body.base64;
      if (typeof rawImage !== "string") {
        return NextResponse.json(
          { success: false, error: "Invalid or missing image payload." },
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
        { success: false, error: "Invalid or missing image upload." },
        { status: 400 }
      );
    }

    const processed = await processImageInput(fileBuffer, { purpose: "match" });
    const embedding = await embedQueryImage(processed.buffer, processed.mimeType);

    let queryHistogram: number[] | null = null;
    try {
      queryHistogram = await computeColorHistogram(processed.buffer);
    } catch (err) {
      console.warn("[Visual Match API] Query histogram failed; embedding rank only.", err);
    }

    // Dynamic AI Category Classification
    let excludeCategories: string[] | undefined = undefined;
    let allowedCategories: string[] | undefined = undefined;

    if (requestedCategory === "pool-tiles") {
      allowedCategories = ["pool-tiles"];
    } else if (requestedCategory !== "all" && requestedCategory) {
      allowedCategories = [requestedCategory];
    } else {
      // Ask Gemini Vision to classify the image context into UN Tiles categories
      try {
        const detectedCategory = await classifyTileCategory(processed.buffer, processed.mimeType);
        if (detectedCategory === "pool-tiles") {
          allowedCategories = ["pool-tiles"];
        } else if (detectedCategory !== "all") {
          excludeCategories = ["pool-tiles"];
        }
      } catch (classifyErr) {
        console.warn("[Tile Matcher] AI category classification skipped:", classifyErr);
      }
    }

    const matches = await retrieveCatalogMatches(embedding, {
      queryHistogram,
      colorWeight: MATCHER_COLOR_WEIGHT,
      excludeCategories,
      allowedCategories,
    });

    const queryTimeMs = Date.now() - startTime;
    return NextResponse.json({
      success: true,
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
