export const MAX_IMAGE_SIZE_BYTES = 4.5 * 1024 * 1024;
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const MAX_EDGE_PX = 1536;
const JPEG_QUALITY = 90;

export interface ProcessedImage {
  buffer: Buffer;
  mimeType: "image/jpeg";
  base64: string;
  width?: number;
  height?: number;
}

export type ImagePurpose = "match" | "scene";

function isJpeg(buffer: Buffer): boolean {
  return buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xd8;
}

function jpegPassthrough(buffer: Buffer): ProcessedImage {
  return {
    buffer,
    mimeType: "image/jpeg",
    base64: buffer.toString("base64"),
  };
}

/**
 * Validates and converts JPEG/PNG/WebP into a JPEG buffer for Gemini embeddings.
 * Sharp is loaded lazily so a native-module failure does not crash the route into an HTML 500.
 *
 * `match` centre-crops extreme aspect ratios so phone photos of a single tile
 * line up with catalog product shots. `scene` keeps the full frame for Vision.
 */
export async function processImageInput(
  inputBuffer: Buffer | Uint8Array | ArrayBuffer,
  options?: { purpose?: ImagePurpose }
): Promise<ProcessedImage> {
  const purpose = options?.purpose ?? "match";
  const buffer = Buffer.isBuffer(inputBuffer)
    ? inputBuffer
    : Buffer.from(inputBuffer as ArrayBuffer);

  if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(
      `Image size (${(buffer.length / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 4MB.`
    );
  }

  try {
    const sharp = (await import("sharp")).default;
    const rotated = sharp(buffer).rotate();
    const metadata = await rotated.metadata();

    if (!metadata.format || !["jpeg", "jpg", "png", "webp"].includes(metadata.format.toLowerCase())) {
      throw new Error(`Unsupported image format "${metadata.format}". Please upload a JPEG, PNG, or WebP image.`);
    }

    let pipeline = rotated;
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;

    if (purpose === "match" && width > 0 && height > 0) {
      const aspect = width / height;
      if (aspect > 1.45 || aspect < 1 / 1.45) {
        const side = Math.min(width, height);
        pipeline = pipeline.extract({
          left: Math.round((width - side) / 2),
          top: Math.round((height - side) / 2),
          width: side,
          height: side,
        });
      }
    }

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
    if (isJpeg(buffer)) {
      console.warn("[visual-search] Sharp unavailable; using original JPEG.", err);
      return jpegPassthrough(buffer);
    }
    throw err instanceof Error ? err : new Error("Could not process this image. Please upload a JPEG, PNG, or WebP.");
  }
}
