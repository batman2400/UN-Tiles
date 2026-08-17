import type { PlacedTile, Rect } from "./types";

function canFitOnOneTile(a: Rect, b: Rect, tileW: number, tileH: number): boolean {
  const orientations: [number, number][] = [
    [a.w, a.h],
    [a.h, a.w],
  ];
  const other: [number, number][] = [
    [b.w, b.h],
    [b.h, b.w],
  ];

  for (const [aw, ah] of orientations) {
    if (aw > tileW || ah > tileH) continue;
    for (const [bw, bh] of other) {
      if (bw > tileW || bh > tileH) continue;
      if (aw + bw <= tileW && Math.max(ah, bh) <= tileH) return true;
      if (ah + bh <= tileH && Math.max(aw, bw) <= tileW) return true;
    }
  }
  return false;
}

/**
 * Pair complementary rectangular cut leftovers onto shared physical tiles.
 * L-shaped used parts cannot pair and each costs one tile.
 */
export function packCuts(
  tiles: PlacedTile[],
  tileW: number,
  tileH: number
): { packedCutTiles: number; pairedCutIds: number[][] } {
  const cuts = tiles.filter((t) => t.kind === "cut");
  const pairable = cuts
    .filter((t) => t.used && t.used.w > 0 && t.used.h > 0)
    .sort((a, b) => b.usedArea - a.usedArea);
  const unpairedL = cuts.length - pairable.length;

  const paired = new Set<number>();
  const pairedCutIds: number[][] = [];

  for (let i = 0; i < pairable.length; i += 1) {
    const a = pairable[i];
    if (paired.has(a.id) || !a.used) continue;
    for (let j = i + 1; j < pairable.length; j += 1) {
      const b = pairable[j];
      if (paired.has(b.id) || !b.used) continue;
      if (canFitOnOneTile(a.used, b.used, tileW, tileH)) {
        paired.add(a.id);
        paired.add(b.id);
        pairedCutIds.push([a.id, b.id]);
        break;
      }
    }
  }

  const unpairedRect = pairable.length - paired.size;
  const packedCutTiles = unpairedL + unpairedRect + pairedCutIds.length;
  return { packedCutTiles, pairedCutIds };
}
