import type { TileSizeMm } from "./types";

const SIZE_RE = /(\d+(?:\.\d+)?)\s*[x×X]\s*(\d+(?:\.\d+)?)/;

/**
 * Parse catalog dimension strings such as "60x60 cm", "120x60 cm",
 * or "30x30 cm Sheet" into millimetres. Defaults to centimetres when
 * no unit is present (catalog convention).
 */
export function parseDimensions(raw: string): TileSizeMm | null {
  if (typeof raw !== "string") return null;
  const text = raw.trim();
  if (!text) return null;

  const match = text.match(SIZE_RE);
  if (!match) return null;

  const a = Number(match[1]);
  const b = Number(match[2]);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) {
    return null;
  }

  const lower = text.toLowerCase();
  let factor = 10; // cm → mm
  if (/\bmm\b/.test(lower)) factor = 1;
  else if (/\bin(?:ch(?:es)?)?\b/.test(lower) || /["″]/.test(text)) factor = 25.4;
  else if (/\bm\b/.test(lower) && !/\bcm\b/.test(lower) && !/\bmm\b/.test(lower)) {
    factor = 1000;
  }

  const widthMm = Math.round(a * factor);
  const heightMm = Math.round(b * factor);
  if (widthMm < 1 || heightMm < 1) return null;

  return { widthMm, heightMm };
}

export function productHasParsableSize(dimensions: string): boolean {
  return parseDimensions(dimensions) !== null;
}
