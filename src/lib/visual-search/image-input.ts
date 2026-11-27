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
 * Strict pure-JS JPEG structural validator used ONLY when Sharp's native binary
 * is unavailable on a serverless runtime. Walks JPEG marker segments, extracts
 * SOF dimensions, enforces MAX_INPUT_PIXELS, and verifies SOS + EOI markers so
 * spoofed or truncated `FF D8` buffers are always rejected.
 */
export function validateJpegStructure(buffer: Buffer): { width: number; height: number } {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    throw new ImageValidationError(
      "Could not read this image. Please upload a valid JPEG, PNG, or WebP photo.",
      400
    );
  }

  let offset = 2;
  let width = 0;
  let height = 0;
  let foundSos = false;

  while (offset < buffer.length - 1) {
    // Skip any 0xFF fill bytes before marker code
    while (offset < buffer.length && buffer[offset] === 0xff) {
      offset++;
    }
    if (offset >= buffer.length) break;

    const marker = buffer[offset++];

    // Standalone markers with no length field (RST0-RST7, SOI, TEM)
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) {
      continue;
    }

    // EOI reached before SOS
    if (marker === 0xd9) {
      break;
    }

    if (offset + 2 > buffer.length) {
      throw new ImageValidationError("Corrupted JPEG header. Please upload another photo.", 400);
    }

    const segmentLength = buffer.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > buffer.length) {
      throw new ImageValidationError("Corrupted JPEG segment. Please upload another photo.", 400);
    }

    // SOF markers carrying image dimensions (Baseline, Extended, Progressive, etc.)
    const isSof =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);

    if (isSof) {
      if (segmentLength < 7) {
        throw new ImageValidationError("Corrupted JPEG frame header.", 400);
      }
      height = buffer.readUInt16BE(offset + 3);
      width = buffer.readUInt16BE(offset + 5);
    }

    // Start of Scan — compressed image data follows until EOI (0xFF 0xD9)
    if (marker === 0xda) {
      foundSos = true;
      break;
    }

    offset += segmentLength;
  }

  // Verify EOI (FF D9) appears near the end (allowing trailing padding bytes)
  let foundEoi = false;
  for (let i = buffer.length - 2; i >= Math.max(0, buffer.length - 64); i--) {
    if (buffer[i] === 0xff && buffer[i + 1] === 0xd9) {
      foundEoi = true;
      break;
    }
  }

  if (!foundSos || !foundEoi || width <= 0 || height <= 0) {
    throw new ImageValidationError(
      "Could not read this image. Please upload a valid JPEG, PNG, or WebP photo.",
      400
    );
  }

  if (width * height > MAX_INPUT_PIXELS) {
    throw new ImageValidationError(
      "Image dimensions are too large. Please upload a smaller photo.",
      413
    );
  }

  return { width, height };
}

/**
 * Validates and converts JPEG/PNG/WebP into a normalized JPEG buffer for Gemini embeddings.
 * Uses strict Sharp decode validation when available; if Sharp's native addon cannot load
 * on serverless infrastructure, falls back strictly to structural JPEG validation rather
 * than bypassing decode errors.
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

  let sharpFn: (typeof import("sharp"))["default"] | null = null;
  try {
    sharpFn = (await import("sharp")).default;
  } catch (loadErr) {
    console.warn("[visual-search] Sharp native module unavailable; using strict JPEG validator.", loadErr);
  }

  if (!sharpFn) {
    const { width, height } = validateJpegStructure(buffer);
    return {
      buffer,
      mimeType: "image/jpeg",
      base64: buffer.toString("base64"),
      width,
      height,
    };
  }

  try {
    const rotated = sharpFn(buffer, { limitInputPixels: MAX_INPUT_PIXELS }).rotate();
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

    const outMeta = await sharpFn(outputBuffer).metadata();

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
    if (/could not load.*sharp|err_dlopen_failed|cannot find module|module_not_found/i.test(msg)) {
      console.warn("[visual-search] Sharp runtime error; using strict JPEG validator.", err);
      const { width, height } = validateJpegStructure(buffer);
      return {
        buffer,
        mimeType: "image/jpeg",
        base64: buffer.toString("base64"),
        width,
        height,
      };
    }
    if (/pixel limit/i.test(msg)) {
      throw new ImageValidationError(
        "Image dimensions are too large. Please upload a smaller photo.",
        413
      );
    }
    console.warn("[visual-search] Sharp decode error:", msg);
    throw new ImageValidationError(
      "Could not read this image. Please upload a valid JPEG, PNG, or WebP photo.",
      400
    );
  }
}
