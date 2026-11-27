export const MAX_IMAGE_SIZE_BYTES = 4.5 * 1024 * 1024;
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const MAX_EDGE_PX = 1536;
const MAX_INPUT_PIXELS = 40_000_000;
const JPEG_QUALITY = 90;

export interface ProcessedImage {
  buffer: Buffer;
  mimeType: "image/jpeg";
  base64: string;
  width?: number;
  height?: number;
}

export type ImagePurpose = "match" | "scene";

export class ImageValidationError extends Error {
  readonly status: 400 | 413;
  constructor(message: string, status: 400 | 413 = 400) {
    super(message);
    this.name = "ImageValidationError";
    this.status = status;
  }
}

/**
 * Validates and converts JPEG/PNG/WebP into a normalized JPEG buffer for Gemini embeddings.
 * Uses strict Sharp decode validation with pixel-count limits to prevent decompression bombs.
 */
export async function processImageInput(
  inputBuffer: Buffer | Uint8Array | ArrayBuffer,
  _options?: { purpose?: ImagePurpose }
): Promise<ProcessedImage> {
  void _options;
  const buffer = Buffer.isBuffer(inputBuffer)
    ? inputBuffer
    : Buffer.from(inputBuffer as ArrayBuffer);

  if (buffer.length === 0) {
    throw new ImageValidationError("Image file is empty. Please upload a JPEG, PNG, or WebP image.", 400);
  }

  if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
    throw new ImageValidationError(
      `Image size (${(buffer.length / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 4.5MB.`,
      413
    );
  }

  try {
    const sharp = (await import("sharp")).default;
    const rotated = sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS }).rotate();
    const metadata = await rotated.metadata();

    if (!metadata.format || !["jpeg", "jpg", "png", "webp"].includes(metadata.format.toLowerCase())) {
      throw new ImageValidationError(
        `Unsupported image format "${metadata.format ?? "unknown"}". Please upload a JPEG, PNG, or WebP image.`,
        400
      );
    }

    let pipeline = rotated;
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;

    if (width > MAX_EDGE_PX || height > MAX_EDGE_PX) {
      pipeline = pipeline.resize({
        width: MAX_EDGE_PX,
        height: MAX_EDGE_PX,
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    const outputBuffer = await pipeline
      .jpeg({
        quality: JPEG_QUALITY,
        progressive: true,
      })
      .toBuffer();

    const outMeta = await sharp(outputBuffer).metadata();

    return {
      buffer: outputBuffer,
      mimeType: "image/jpeg",
      base64: outputBuffer.toString("base64"),
      width: outMeta.width,
      height: outMeta.height,
    };
  } catch (err: unknown) {
    if (err instanceof ImageValidationError) {
      throw err;
    }
    const msg = err instanceof Error ? err.message : "";
    if (/pixel limit/i.test(msg)) {
      throw new ImageValidationError(
        "Image dimensions are too large. Please upload a smaller photo.",
        413
      );
    }
    throw new ImageValidationError(
      "Could not read this image. Please upload a valid JPEG, PNG, or WebP photo.",
      400
    );
  }
}
