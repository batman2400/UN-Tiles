/** 1 foot = 304.8 mm exactly. */
export const MM_PER_FT = 304.8;
export const MM_PER_M = 1000;
export const MM2_PER_SQFT = MM_PER_FT * MM_PER_FT;

export function toMm(value: number, unit: "ft" | "m"): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const mm = unit === "ft" ? value * MM_PER_FT : value * MM_PER_M;
  return Math.max(0, Math.round(mm));
}

export function mm2ToSqft(mm2: number): number {
  if (!Number.isFinite(mm2) || mm2 <= 0) return 0;
  return mm2 / MM2_PER_SQFT;
}

export function tileAreaSqft(widthMm: number, heightMm: number): number {
  return mm2ToSqft(widthMm * heightMm);
}
