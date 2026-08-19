import sharp from "sharp";

export const MAX_IMAGE_SIZE_BYTES = 4.5 * 1024 * 1024; // ~4.5 MB
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

export interface ProcessedImage {
  buffer: Buffer;
  mimeType: "image/jpeg";
  base64: string;
  width?: number;
  height?: number;
}

/**
 * Validates and converts an image buffer (JPEG, PNG, WebP) into an optimized JPEG buffer and base64.
 * Resizes images exceeding 1024px to ensure fast embedding latency.
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

  // Use sharp to inspect metadata and convert to standard JPEG
  const image = sharp(buffer);
  const metadata = await image.metadata();

  if (!metadata.format || !["jpeg", "jpg", "png", "webp"].includes(metadata.format.toLowerCase())) {
    throw new Error(`Unsupported image format "${metadata.format}". Please upload a JPEG, PNG, or WebP image.`);
  }

  // Resize if larger than 1024 in any dimension, maintaining aspect ratio
  const pipeline = image.rotate(); // Auto-orient based on EXIF
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
}
