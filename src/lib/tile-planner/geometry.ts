import type { Point, Rect, RoomMm } from "./types";

export function rectArea(r: Rect): number {
  return r.w * r.h;
}

export function intersectRects(a: Rect, b: Rect): Rect | null {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.w, b.x + b.w);
  const bottom = Math.min(a.y + a.h, b.y + b.h);
  if (right <= x || bottom <= y) return null;
  return { x, y, w: right - x, h: bottom - y };
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return intersectRects(a, b) !== null;
}

export function boundingRect(room: RoomMm): Rect {
  return { x: 0, y: 0, w: room.width, h: room.height };
}

export function notchRect(room: RoomMm): Rect | null {
  if (!room.notch) return null;
  const { width, height, corner } = room.notch;
  switch (corner) {
    case "NW":
      return { x: 0, y: 0, w: width, h: height };
    case "NE":
      return { x: room.width - width, y: 0, w: width, h: height };
    case "SW":
      return { x: 0, y: room.height - height, w: width, h: height };
    case "SE":
      return { x: room.width - width, y: room.height - height, w: width, h: height };
  }
}

export function roomAreaMm2(room: RoomMm): number {
  const full = room.width * room.height;
  if (!room.notch) return full;
  return full - room.notch.width * room.notch.height;
}

export function isTileFullyInRoom(tile: Rect, room: RoomMm): boolean {
  const bounds = boundingRect(room);
  if (tile.x < bounds.x || tile.y < bounds.y) return false;
  if (tile.x + tile.w > bounds.x + bounds.w) return false;
  if (tile.y + tile.h > bounds.y + bounds.h) return false;
  const notch = notchRect(room);
  if (notch && rectsOverlap(tile, notch)) return false;
  return true;
}

/**
 * Subtract `hole` from `outer` when the hole is contained in outer.
 * Returns a rectangle if the remainder is rectangular, otherwise null (L-shape).
 */
export function subtractRect(outer: Rect, hole: Rect): Rect | null {
  const cut = intersectRects(outer, hole);
  if (!cut) return outer;
  if (cut.w === outer.w && cut.h === outer.h) return null;
  if (cut.w <= 0 || cut.h <= 0) return outer;

  if (cut.w === outer.w) {
    if (cut.y === outer.y) {
      const h = outer.h - cut.h;
      if (h <= 0) return null;
      return { x: outer.x, y: cut.y + cut.h, w: outer.w, h };
    }
    if (cut.y + cut.h === outer.y + outer.h) {
      const h = outer.h - cut.h;
      if (h <= 0) return null;
      return { x: outer.x, y: outer.y, w: outer.w, h };
    }
  }

  if (cut.h === outer.h) {
    if (cut.x === outer.x) {
      const w = outer.w - cut.w;
      if (w <= 0) return null;
      return { x: cut.x + cut.w, y: outer.y, w, h: outer.h };
    }
    if (cut.x + cut.w === outer.x + outer.w) {
      const w = outer.w - cut.w;
      if (w <= 0) return null;
      return { x: outer.x, y: outer.y, w, h: outer.h };
    }
  }

  return null;
}

export function clipTileToRoom(
  tile: Rect,
  room: RoomMm
): { used: Rect | null; usedArea: number } | null {
  const clipped = intersectRects(tile, boundingRect(room));
  if (!clipped) return null;

  const notch = notchRect(room);
  if (!notch) {
    return { used: clipped, usedArea: rectArea(clipped) };
  }

  const hole = intersectRects(clipped, notch);
  if (!hole) {
    return { used: clipped, usedArea: rectArea(clipped) };
  }

  const usedArea = rectArea(clipped) - rectArea(hole);
  if (usedArea <= 0) return null;

  return { used: subtractRect(clipped, hole), usedArea };
}

export function roomPolygon(room: RoomMm): Point[] {
  const W = room.width;
  const H = room.height;
  if (!room.notch) {
    return [
      { x: 0, y: 0 },
      { x: W, y: 0 },
      { x: W, y: H },
      { x: 0, y: H },
    ];
  }

  const nW = room.notch.width;
  const nH = room.notch.height;
  switch (room.notch.corner) {
    case "NW":
      return [
        { x: nW, y: 0 },
        { x: W, y: 0 },
        { x: W, y: H },
        { x: 0, y: H },
        { x: 0, y: nH },
        { x: nW, y: nH },
      ];
    case "NE":
      return [
        { x: 0, y: 0 },
        { x: W - nW, y: 0 },
        { x: W - nW, y: nH },
        { x: W, y: nH },
        { x: W, y: H },
        { x: 0, y: H },
      ];
    case "SW":
      return [
        { x: 0, y: 0 },
        { x: W, y: 0 },
        { x: W, y: H },
        { x: nW, y: H },
        { x: nW, y: H - nH },
        { x: 0, y: H - nH },
      ];
    case "SE":
      return [
        { x: 0, y: 0 },
        { x: W, y: 0 },
        { x: W, y: H - nH },
        { x: W - nW, y: H - nH },
        { x: W - nW, y: H },
        { x: 0, y: H },
      ];
  }
}

export function polygonToPath(points: Point[]): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  return `M ${first.x} ${first.y} ${rest.map((p) => `L ${p.x} ${p.y}`).join(" ")} Z`;
}
