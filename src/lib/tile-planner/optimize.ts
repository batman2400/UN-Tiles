import { computeFromMm } from "./compute";
import type { Pattern, PlannerResult, RoomMm } from "./types";

const OFFSET_STEPS = 8;

function sampleOffsets(pitch: number): number[] {
  if (pitch <= 1) return [0];
  const step = Math.max(1, Math.round(pitch / OFFSET_STEPS));
  const values: number[] = [];
  for (let v = 0; v < pitch; v += step) values.push(v);
  if (values[values.length - 1] !== 0 && !values.includes(0)) values.unshift(0);
  return values;
}

export type MinimizeWasteParams = {
  room: RoomMm;
  tileWidthMm: number;
  tileHeightMm: number;
  groutMm: number;
  pattern: Pattern;
  allowRotate: boolean;
  breakageBuffer: number;
};

/**
 * Search start offsets (and rotation for non-square tiles) for the fewest physical tiles.
 */
export function minimizeWaste(params: MinimizeWasteParams): PlannerResult {
  const square = params.tileWidthMm === params.tileHeightMm;
  const rotations = params.allowRotate && !square ? [false, true] : [false];
  const grout = Math.max(0, params.groutMm);
  const tileW0 = params.tileWidthMm;
  const tileH0 = params.tileHeightMm;
  if (
    (Math.ceil(params.room.width / Math.min(tileW0, tileH0)) + 2) *
      (Math.ceil(params.room.height / Math.min(tileW0, tileH0)) + 2) >
    8000
  ) {
    return computeFromMm(
      params.room,
      tileW0,
      tileH0,
      grout,
      params.pattern,
      0,
      0,
      false,
      params.breakageBuffer
    );
  }

  let best: PlannerResult | null = null;

  for (const rotate of rotations) {
    const tileW = rotate ? params.tileHeightMm : params.tileWidthMm;
    const tileH = rotate ? params.tileWidthMm : params.tileHeightMm;
    const pitchX = tileW + grout;
    const pitchY = tileH + grout;
    const xs = sampleOffsets(pitchX);
    const ys = sampleOffsets(pitchY);

    for (const ox of xs) {
      for (const oy of ys) {
        const result = computeFromMm(
          params.room,
          tileW,
          tileH,
          grout,
          params.pattern,
          ox,
          oy,
          rotate,
          params.breakageBuffer
        );
        if (
          !best ||
          result.physicalTiles < best.physicalTiles ||
          (result.physicalTiles === best.physicalTiles && result.wastePct < best.wastePct)
        ) {
          best = result;
        }
      }
    }
  }

  if (!best) {
    return computeFromMm(
      params.room,
      params.tileWidthMm,
      params.tileHeightMm,
      grout,
      params.pattern,
      0,
      0,
      false,
      params.breakageBuffer
    );
  }

  return best;
}
