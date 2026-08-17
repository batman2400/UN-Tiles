import { clipTileToRoom, isTileFullyInRoom } from "./geometry";
import type { LayoutParams, PlacedTile, Rect, RoomMm } from "./types";

function rangeInclusive(start: number, end: number): number[] {
  const out: number[] = [];
  for (let i = start; i <= end; i += 1) out.push(i);
  return out;
}

/**
 * Place a straight or brick grid over the room bounding box.
 * Tiles that do not intersect the room (e.g. fully in an L-notch) are dropped.
 */
export function layoutTiles(room: RoomMm, params: LayoutParams): PlacedTile[] {
  const tileW = params.tileWidthMm;
  const tileH = params.tileHeightMm;
  const grout = Math.max(0, params.groutMm);
  if (tileW < 1 || tileH < 1) return [];

  const pitchX = tileW + grout;
  const pitchY = tileH + grout;
  const offsetX = ((params.offsetXMm % pitchX) + pitchX) % pitchX;
  const offsetY = ((params.offsetYMm % pitchY) + pitchY) % pitchY;
  const brickShift = params.pattern === "brick" ? Math.round(tileW / 2) : 0;

  const minCol = Math.floor((-tileW - Math.max(offsetX, offsetX + brickShift)) / pitchX);
  const maxCol = Math.ceil((room.width - Math.min(offsetX, offsetX + brickShift)) / pitchX);
  const minRow = Math.floor((-tileH - offsetY) / pitchY);
  const maxRow = Math.ceil((room.height - offsetY) / pitchY);

  const tiles: PlacedTile[] = [];
  let id = 0;

  for (const row of rangeInclusive(minRow, maxRow)) {
    const y = offsetY + row * pitchY;
    const rowShift = brickShift !== 0 && ((row % 2) + 2) % 2 === 1 ? brickShift : 0;

    for (const col of rangeInclusive(minCol, maxCol)) {
      const x = offsetX + rowShift + col * pitchX;
      const rect: Rect = { x, y, w: tileW, h: tileH };
      const clipped = clipTileToRoom(rect, room);
      if (!clipped) continue;

      const full = isTileFullyInRoom(rect, room);
      tiles.push({
        id: id++,
        x,
        y,
        w: tileW,
        h: tileH,
        kind: full ? "full" : "cut",
        used: clipped.used,
        usedArea: clipped.usedArea,
      });
    }
  }

  return tiles;
}
