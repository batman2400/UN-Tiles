import { minimizeWaste } from "./optimize";
import { parseDimensions } from "./parseDimensions";
import type { Pattern, RoomMm } from "./types";

/** Minimum waste-percentage-point improvement to surface a suggestion. */
const MIN_WASTE_REDUCTION_PP = 3;
/** Maximum number of candidates to return. */
const MAX_RESULTS = 3;

export type BestFitCandidate = {
  productId: string;
  productName: string;
  dimensions: string;
  image: string;
  category: string;
  pricePerSqft: number;
  tileWidthMm: number;
  tileHeightMm: number;
  wastePct: number;
  recommendedSqft: number;
  physicalTiles: number;
  estimatedCost: number;
  savingsVsCurrent: number;
  wasteReduction: number;
};

export type CatalogEntry = {
  id: string;
  name: string;
  dimensions: string;
  image: string;
  category: string;
  pricePerSqft: number;
};

export type BestFitParams = {
  room: RoomMm;
  groutMm: number;
  pattern: Pattern;
  breakageBuffer: number;
  currentProductId: string;
  catalog: CatalogEntry[];
  currentWastePct: number;
  currentCost: number;
};

/**
 * Scan every plannable tile in the catalog against the given room,
 * run the offset optimizer on each, and return the top alternatives
 * that meaningfully reduce waste compared to the currently selected tile.
 */
export function findBestFitTiles(params: BestFitParams): BestFitCandidate[] {
  const {
    room,
    groutMm,
    pattern,
    breakageBuffer,
    currentProductId,
    catalog,
    currentWastePct,
    currentCost,
  } = params;

  const candidates: BestFitCandidate[] = [];

  for (const entry of catalog) {
    // Skip the tile the user already has selected
    if (entry.id === currentProductId) continue;

    const size = parseDimensions(entry.dimensions);
    if (!size) continue;

    // Guard: skip tiles that would exceed the layout grid cap
    const minDim = Math.min(size.widthMm, size.heightMm);
    const cols = Math.ceil(room.width / minDim) + 2;
    const rows = Math.ceil(room.height / minDim) + 2;
    if (cols * rows > 8000) continue;

    const square = size.widthMm === size.heightMm;

    const best = minimizeWaste({
      room,
      tileWidthMm: size.widthMm,
      tileHeightMm: size.heightMm,
      groutMm,
      pattern,
      allowRotate: !square,
      breakageBuffer,
    });

    const wasteReduction =
      Math.round(currentWastePct * 1000) / 10 -
      Math.round(best.wastePct * 1000) / 10;

    if (wasteReduction < MIN_WASTE_REDUCTION_PP) continue;

    const estimatedCost = best.recommendedSqft * entry.pricePerSqft;

    candidates.push({
      productId: entry.id,
      productName: entry.name,
      dimensions: entry.dimensions,
      image: entry.image,
      category: entry.category,
      pricePerSqft: entry.pricePerSqft,
      tileWidthMm: size.widthMm,
      tileHeightMm: size.heightMm,
      wastePct: best.wastePct,
      recommendedSqft: best.recommendedSqft,
      physicalTiles: best.physicalTiles,
      estimatedCost,
      savingsVsCurrent: currentCost - estimatedCost,
      wasteReduction,
    });
  }

  // Sort by lowest waste first, then by lowest cost as tiebreaker
  candidates.sort((a, b) => {
    if (a.wastePct !== b.wastePct) return a.wastePct - b.wastePct;
    return a.estimatedCost - b.estimatedCost;
  });

  return candidates.slice(0, MAX_RESULTS);
}
