export type LengthUnit = "ft" | "m";
export type RoomShape = "rectangle" | "l-shape";
export type Pattern = "straight" | "brick";
export type NotchCorner = "NW" | "NE" | "SW" | "SE";

export type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Point = {
  x: number;
  y: number;
};

export type RoomMm = {
  width: number;
  height: number;
  notch: { width: number; height: number; corner: NotchCorner } | null;
};

export type PlacedTile = {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: "full" | "cut";
  /** Rectangular used part when the leftover is a simple rect; null when L-shaped. */
  used: Rect | null;
  usedArea: number;
};

export type TileSizeMm = {
  widthMm: number;
  heightMm: number;
};

export type LayoutParams = {
  tileWidthMm: number;
  tileHeightMm: number;
  groutMm: number;
  pattern: Pattern;
  offsetXMm: number;
  offsetYMm: number;
};

export type PlannerInput = {
  tileWidthMm: number;
  tileHeightMm: number;
  roomWidth: number;
  roomHeight: number;
  unit: LengthUnit;
  shape: RoomShape;
  notchWidth: number;
  notchHeight: number;
  notchCorner: NotchCorner;
  groutMm: number;
  pattern: Pattern;
  rotate: boolean;
  offsetXMm: number;
  offsetYMm: number;
  breakageBuffer: number;
};

export type PlannerResult = {
  ok: true;
  tiles: PlacedTile[];
  room: RoomMm;
  roomPolygon: Point[];
  tileWidthMm: number;
  tileHeightMm: number;
  pitchXMm: number;
  pitchYMm: number;
  offsetXMm: number;
  offsetYMm: number;
  rotate: boolean;
  fullCount: number;
  cutCount: number;
  packedCutTiles: number;
  physicalTiles: number;
  usedTileAreaMm2: number;
  purchasedTileAreaMm2: number;
  roomAreaMm2: number;
  wastePct: number;
  tileAreaSqft: number;
  recommendedSqft: number;
  pairedCutIds: number[][];
};

export type PlannerFailure = {
  ok: false;
  error: string;
};

export type PlanOutput = PlannerResult | PlannerFailure;
