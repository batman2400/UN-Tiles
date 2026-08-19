import { HISTOGRAM_BINS, HUE_BINS, SAT_BINS, VAL_BINS } from "./constants";
import { normalizeVector } from "./cosine";

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rn) {
      h = ((gn - bn) / delta) % 6;
    } else if (max === gn) {
      h = (bn - rn) / delta + 2;
    } else {
      h = (rn - gn) / delta + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : delta / max;
  return [h, s, max];
}

function emptyBins(): { hue: number[]; sat: number[]; val: number[] } {
  return {
    hue: new Array(HUE_BINS).fill(0),
    sat: new Array(SAT_BINS).fill(0),
    val: new Array(VAL_BINS).fill(0),
  };
}

function binsToVector(bins: { hue: number[]; sat: number[]; val: number[] }): number[] {
  return normalizeVector([...bins.hue, ...bins.sat, ...bins.val]);
}

function accumulateRgb(
  bins: { hue: number[]; sat: number[]; val: number[] },
  r: number,
  g: number,
  b: number,
  weight = 1
) {
  const [h, s, v] = rgbToHsv(r, g, b);
  // Near-grey pixels are unreliable for hue — skip hue, keep tone.
  if (s >= 0.08) {
    const hueIndex = Math.min(HUE_BINS - 1, Math.floor((h / 360) * HUE_BINS));
    bins.hue[hueIndex] += weight;
  }
  bins.sat[Math.min(SAT_BINS - 1, Math.floor(s * SAT_BINS))] += weight;
  bins.val[Math.min(VAL_BINS - 1, Math.floor(v * VAL_BINS))] += weight;
}

function parseHex(hex: string): [number, number, number] | null {
  const cleaned = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return null;
  return [
    parseInt(cleaned.slice(0, 2), 16),
    parseInt(cleaned.slice(2, 4), 16),
    parseInt(cleaned.slice(4, 6), 16),
  ];
}

/**
 * Compact HSV histogram of a JPEG/PNG buffer. Used to re-rank embedding neighbours
 * so beige vs grey marble of the same series is distinguished.
 */
export async function computeColorHistogram(imageBuffer: Buffer): Promise<number[]> {
  const sharp = (await import("sharp")).default;
  const { data, info } = await sharp(imageBuffer)
    .rotate()
    .resize(64, 64, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const bins = emptyBins();
  const channels = info.channels;
  for (let i = 0; i < data.length; i += channels) {
    accumulateRgb(bins, data[i], data[i + 1], data[i + 2]);
  }

  return binsToVector(bins);
}

/** Soft histogram from a handful of hex swatches (Scene Advisor palette). */
export function histogramFromPalette(hexColors: string[]): number[] | null {
  const bins = emptyBins();
  let added = 0;
  for (const hex of hexColors) {
    const rgb = parseHex(hex);
    if (!rgb) continue;
    accumulateRgb(bins, rgb[0], rgb[1], rgb[2], 4);
    added += 1;
  }
  if (added === 0) return null;
  return binsToVector(bins);
}

export function isHistogram(value: unknown): value is number[] {
  return Array.isArray(value) && value.length === HISTOGRAM_BINS && value.every((n) => typeof n === "number");
}

const histogramCache = new Map<string, number[]>();

/**
 * Histogram for a catalog image path (`/tiles/...`) or remote URL.
 * Cached per process so repeat Matcher queries stay cheap.
 */
export async function histogramForImageUrl(imageUrl: string): Promise<number[] | null> {
  const cached = histogramCache.get(imageUrl);
  if (cached) return cached;

  try {
    let raw: Buffer;
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      const response = await fetch(imageUrl);
      if (!response.ok) return null;
      raw = Buffer.from(await response.arrayBuffer());
    } else {
      const fs = await import("fs/promises");
      const path = await import("path");
      const cleanPath = imageUrl.startsWith("/") ? imageUrl.slice(1) : imageUrl;
      raw = await fs.readFile(path.join(process.cwd(), "public", cleanPath));
    }
    const histogram = await computeColorHistogram(raw);
    histogramCache.set(imageUrl, histogram);
    return histogram;
  } catch (err) {
    console.warn("[visual-search] Could not compute catalog histogram.", err);
    return null;
  }
}
