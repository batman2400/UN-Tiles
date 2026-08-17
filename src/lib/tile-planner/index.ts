import { computeFromMm } from "./compute";
import { toMm } from "./units";
import type { PlanOutput, PlannerInput, RoomMm } from "./types";

export { parseDimensions, productHasParsableSize } from "./parseDimensions";
export { minimizeWaste } from "./optimize";
export { mm2ToSqft, tileAreaSqft, toMm } from "./units";
export { polygonToPath, roomPolygon } from "./geometry";
export type {
  LengthUnit,
  NotchCorner,
  Pattern,
  PlanOutput,
  PlannerFailure,
  PlannerInput,
  PlannerResult,
  PlacedTile,
  Point,
  RoomMm,
  RoomShape,
  TileSizeMm,
} from "./types";

function buildRoom(input: PlannerInput): { room: RoomMm } | { error: string } {
  const width = toMm(input.roomWidth, input.unit);
  const height = toMm(input.roomHeight, input.unit);
  if (width < 1 || height < 1) {
    return { error: "Enter a room length and width greater than zero." };
  }

  if (input.shape !== "l-shape") {
    return { room: { width, height, notch: null } };
  }

  const notchWidth = toMm(input.notchWidth, input.unit);
  const notchHeight = toMm(input.notchHeight, input.unit);
  if (notchWidth < 1 || notchHeight < 1) {
    return { error: "Enter a notch size greater than zero for an L-shaped room." };
  }
  if (notchWidth >= width || notchHeight >= height) {
    return { error: "The notch must be smaller than the overall room on both sides." };
  }

  return {
    room: {
      width,
      height,
      notch: {
        width: notchWidth,
        height: notchHeight,
        corner: input.notchCorner,
      },
    },
  };
}

export function planRoom(input: PlannerInput): PlanOutput {
  if (input.tileWidthMm < 1 || input.tileHeightMm < 1) {
    return { ok: false, error: "This tile does not have a usable size." };
  }
  if (input.groutMm < 0) {
    return { ok: false, error: "Grout cannot be negative." };
  }

  const built = buildRoom(input);
  if ("error" in built) return { ok: false, error: built.error };

  const tileW = input.rotate ? input.tileHeightMm : input.tileWidthMm;
  const tileH = input.rotate ? input.tileWidthMm : input.tileHeightMm;
  const cols = Math.ceil(built.room.width / tileW) + 2;
  const rows = Math.ceil(built.room.height / tileH) + 2;
  if (cols * rows > 8000) {
    return {
      ok: false,
      error: "This room is too large to preview at the selected tile size. Check the units and dimensions.",
    };
  }

  return computeFromMm(
    built.room,
    tileW,
    tileH,
    input.groutMm,
    input.pattern,
    input.offsetXMm,
    input.offsetYMm,
    input.rotate,
    input.breakageBuffer
  );
}

export function roomFromInput(input: PlannerInput): RoomMm | null {
  const built = buildRoom(input);
  if ("error" in built) return null;
  return built.room;
}
