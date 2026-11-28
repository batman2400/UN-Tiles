"use client";

import { useId } from "react";
import { polygonToPath } from "@/lib/tile-planner";
import type { PlannerResult } from "@/lib/tile-planner";

export function LayoutCanvas({
  result,
  widthLabel,
  heightLabel,
}: {
  result: PlannerResult | null;
  widthLabel?: string;
  heightLabel?: string;
}) {
  const uid = useId().replace(/:/g, "");

  if (!result) {
    return (
      <div className="flex items-center justify-center aspect-[4/3] rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-400">
        Enter a room and choose a tile to preview the layout.
      </div>
    );
  }

  const { room, roomPolygon: poly, tiles, pairedCutIds } = result;
  const maxDim = Math.max(room.width, room.height);
  const pad = maxDim * 0.04;
  const labelSize = Math.max(maxDim * 0.032, 14);
  const topExtra = widthLabel ? labelSize * 1.9 : 0;
  const leftExtra = heightLabel ? labelSize * 1.9 : 0;
  const clipId = `room-clip-${uid}`;
  const hatchId = `cut-hatch-${uid}`;
  const pairSet = new Set(pairedCutIds.flat());
  const path = polygonToPath(poly);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <svg
        viewBox={`${-(pad + leftExtra)} ${-(pad + topExtra)} ${room.width + pad * 2 + leftExtra} ${room.height + pad * 2 + topExtra}`}
        className="w-full h-auto max-h-[min(58vh,500px)] bg-[#f7f5f2]"
        role="img"
        aria-label="Tile layout preview"
      >
        <defs>
          <clipPath id={clipId}>
            <path d={path} />
          </clipPath>
          <pattern
            id={hatchId}
            patternUnits="userSpaceOnUse"
            width={Math.max(8, room.width / 80)}
            height={Math.max(8, room.height / 80)}
            patternTransform="rotate(45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2={Math.max(8, room.height / 80)}
              stroke="#9f403d"
              strokeWidth={Math.max(1.5, room.width / 400)}
              strokeOpacity="0.45"
            />
          </pattern>
        </defs>

        <path d={path} fill="#efeae3" />

        <g clipPath={`url(#${clipId})`}>
          {tiles.map((tile) => {
            const paired = pairSet.has(tile.id);
            const isCut = tile.kind === "cut";
            const fill = isCut ? `url(#${hatchId})` : "rgba(180, 83, 9, 0.18)";
            const stroke = isCut
              ? paired
                ? "rgba(15, 118, 110, 0.9)"
                : "rgba(159, 64, 61, 0.75)"
              : "rgba(180, 83, 9, 0.55)";
            return (
              <rect
                key={tile.id}
                x={tile.x}
                y={tile.y}
                width={tile.w}
                height={tile.h}
                fill={fill}
                stroke={stroke}
                strokeWidth={Math.max(1, Math.min(tile.w, tile.h) / (paired ? 50 : 80))}
              />
            );
          })}
        </g>

        <path d={path} fill="none" stroke="#1c1917" strokeWidth={Math.max(2, pad * 0.12)} />

        {widthLabel && (
          <text
            x={room.width / 2}
            y={-(topExtra * 0.42)}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#57534e"
            fontSize={labelSize}
            fontWeight="600"
            fontFamily="var(--font-sans), sans-serif"
          >
            {widthLabel}
          </text>
        )}

        {heightLabel && (
          <text
            x={-(leftExtra * 0.48)}
            y={room.height / 2}
            textAnchor="middle"
            dominantBaseline="central"
            transform={`rotate(-90 ${-(leftExtra * 0.48)} ${room.height / 2})`}
            fill="#57534e"
            fontSize={labelSize}
            fontWeight="600"
            fontFamily="var(--font-sans), sans-serif"
          >
            {heightLabel}
          </text>
        )}
      </svg>

      <div className="flex flex-wrap gap-4 px-4 py-3 border-t border-gray-100 text-[11px] uppercase tracking-wider text-gray-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-accent/30 border border-accent/60" />
          Uncut
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-[#9f403d]/70 bg-[repeating-linear-gradient(45deg,#9f403d_0_2px,transparent_2px_4px)]" />
          Cut
        </span>
        <span className="inline-flex items-center gap-1.5" title="Combines leftover pieces from other cuts to save tiles">
          <span className="h-3 w-3 rounded-sm border-2 border-teal-700 bg-[repeating-linear-gradient(45deg,#9f403d_0_2px,transparent_2px_4px)]" />
          Reused off-cuts
        </span>
      </div>
    </div>
  );
}
