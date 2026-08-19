import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/visual-search/rate-limit";
import { processImageInput } from "@/lib/visual-search/image-input";
import { embedQueryImage } from "@/lib/visual-search/gemini-embeddings";
import { computeColorHistogram } from "@/lib/visual-search/color-histogram";
import { retrieveCatalogMatches } from "@/lib/visual-search/retrieve";
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

    const processed = await processImageInput(fileBuffer, { purpose: "match" });
    const embedding = await embedQueryImage(processed.buffer, processed.mimeType);

    let queryHistogram: number[] | null = null;
    try {
      queryHistogram = await computeColorHistogram(processed.buffer);
    } catch (err) {
      console.warn("[Visual Match API] Query histogram failed; embedding rank only.", err);
    }

    const matches = await retrieveCatalogMatches(embedding, {
      queryHistogram,
      colorWeight: MATCHER_COLOR_WEIGHT,
    });

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
