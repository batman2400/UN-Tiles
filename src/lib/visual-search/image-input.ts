export const MAX_IMAGE_SIZE_BYTES = 4.5 * 1024 * 1024;
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

export interface ProcessedImage {
  buffer: Buffer;
  mimeType: "image/jpeg";
  base64: string;
  width?: number;
  height?: number;
}

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
 */
export async function processImageInput(
  inputBuffer: Buffer | Uint8Array | ArrayBuffer
): Promise<ProcessedImage> {
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
    const image = sharp(buffer);
    const metadata = await image.metadata();

    if (!metadata.format || !["jpeg", "jpg", "png", "webp"].includes(metadata.format.toLowerCase())) {
      throw new Error(`Unsupported image format "${metadata.format}". Please upload a JPEG, PNG, or WebP image.`);
    }

    const pipeline = image.rotate();
    if ((metadata.width && metadata.width > 1024) || (metadata.height && metadata.height > 1024)) {
      pipeline.resize({
        width: 1024,
        height: 1024,
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    const outputBuffer = await pipeline
      .jpeg({
        quality: 85,
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
