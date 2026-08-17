import { roomAreaMm2, roomPolygon } from "./geometry";
import { layoutTiles } from "./layout";
import { packCuts } from "./packCuts";
import { tileAreaSqft } from "./units";
import type { LayoutParams, PlannerResult, RoomMm } from "./types";

export function computeFromMm(
  room: RoomMm,
  tileWidthMm: number,
  tileHeightMm: number,
  groutMm: number,
  pattern: LayoutParams["pattern"],
  offsetXMm: number,
  offsetYMm: number,
  rotate: boolean,
  breakageBuffer: number
): PlannerResult {
  const tiles = layoutTiles(room, {
    tileWidthMm,
    tileHeightMm,
    groutMm,
    pattern,
    offsetXMm,
    offsetYMm,
  });

  const { packedCutTiles, pairedCutIds } = packCuts(tiles, tileWidthMm, tileHeightMm);
  const fullCount = tiles.filter((t) => t.kind === "full").length;
  const cutCount = tiles.length - fullCount;
  const physicalTiles = fullCount + packedCutTiles;
  const tileMm2 = tileWidthMm * tileHeightMm;
  const usedTileAreaMm2 = tiles.reduce((sum, t) => sum + t.usedArea, 0);
  const purchasedTileAreaMm2 = physicalTiles * tileMm2;
  const roomMm2 = roomAreaMm2(room);
  const wastePct =
    purchasedTileAreaMm2 > 0
      ? Math.max(0, (purchasedTileAreaMm2 - usedTileAreaMm2) / purchasedTileAreaMm2)
      : 0;
  const areaSqft = tileAreaSqft(tileWidthMm, tileHeightMm);
  const buffer = Math.min(0.1, Math.max(0, breakageBuffer));
  const recommendedSqft =
    physicalTiles > 0 ? Math.ceil(physicalTiles * areaSqft * (1 + buffer)) : 0;
  const pitchXMm = tileWidthMm + Math.max(0, groutMm);
  const pitchYMm = tileHeightMm + Math.max(0, groutMm);

  return {
    ok: true,
    tiles,
    room,
    roomPolygon: roomPolygon(room),
    tileWidthMm,
    tileHeightMm,
    pitchXMm,
    pitchYMm,
    offsetXMm: ((offsetXMm % pitchXMm) + pitchXMm) % pitchXMm,
    offsetYMm: ((offsetYMm % pitchYMm) + pitchYMm) % pitchYMm,
    rotate,
    fullCount,
    cutCount,
    packedCutTiles,
    physicalTiles,
    usedTileAreaMm2,
    purchasedTileAreaMm2,
    roomAreaMm2: roomMm2,
    wastePct,
    tileAreaSqft: areaSqft,
    recommendedSqft,
    pairedCutIds,
  };
}
