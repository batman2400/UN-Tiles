"use client";

import { useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import type { LengthUnit, NotchCorner, Pattern, RoomShape } from "@/lib/tile-planner";
import { polygonToPath, roomPolygon } from "@/lib/tile-planner";

const FIELD =
  "w-full min-h-11 px-3 py-2 bg-white text-sm text-zinc-900 rounded-xl outline-none border border-gray-200 focus:border-accent focus:ring-1 focus:ring-accent/20";

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1">
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`min-h-9 px-2 text-[11px] font-semibold uppercase tracking-wider rounded-lg transition-colors ${
              active ? "bg-white text-zinc-900 shadow-sm" : "text-gray-500 hover:text-zinc-800"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  min = 0.1,
  step = 0.1,
  onChange,
  suffix,
}: {
  id: string;
  label: string;
  value: number;
  min?: number;
  step?: number;
  onChange: (n: number) => void;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
        {label}
      </span>
      <div className="relative">
        <input
          id={id}
          type="number"
          min={min}
          step={step}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={`${FIELD} ${suffix ? "pr-10" : ""}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

function RoomSilhouette({
  shape,
  width,
  height,
  notchWidth,
  notchHeight,
  notchCorner,
}: {
  shape: RoomShape;
  width: number;
  height: number;
  notchWidth: number;
  notchHeight: number;
  notchCorner: NotchCorner;
}) {
  const w = Math.max(1, width || 1);
  const h = Math.max(1, height || 1);
  const nW = shape === "l-shape" ? Math.min(Math.max(0.1, notchWidth || 0.1), w * 0.95) : 0;
  const nH = shape === "l-shape" ? Math.min(Math.max(0.1, notchHeight || 0.1), h * 0.95) : 0;
  const room = {
    width: w,
    height: h,
    notch: shape === "l-shape" ? { width: nW, height: nH, corner: notchCorner } : null,
  };
  const d = polygonToPath(roomPolygon(room));
  const pad = Math.max(w, h) * 0.08;

  return (
    <svg
      viewBox={`${-pad} ${-pad} ${w + pad * 2} ${h + pad * 2}`}
      className="w-full h-20 text-accent"
      aria-hidden
    >
      <path d={d} fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth={pad * 0.15} />
    </svg>
  );
}

const CORNERS: { id: NotchCorner; label: string }[] = [
  { id: "NW", label: "NW" },
  { id: "NE", label: "NE" },
  { id: "SW", label: "SW" },
  { id: "SE", label: "SE" },
];

export function RoomInputs({
  shape,
  unit,
  roomWidth,
  roomHeight,
  notchWidth,
  notchHeight,
  notchCorner,
  groutMm,
  pattern,
  rotate,
  canRotate,
  offsetXMm,
  offsetYMm,
  pitchXMm,
  pitchYMm,
  breakageBuffer,
  onShape,
  onUnit,
  onRoomWidth,
  onRoomHeight,
  onNotchWidth,
  onNotchHeight,
  onNotchCorner,
  onGrout,
  onPattern,
  onRotate,
  onOffsetX,
  onOffsetY,
  onBuffer,
  onMinimizeWaste,
  canMinimize,
}: {
  shape: RoomShape;
  unit: LengthUnit;
  roomWidth: number;
  roomHeight: number;
  notchWidth: number;
  notchHeight: number;
  notchCorner: NotchCorner;
  groutMm: number;
  pattern: Pattern;
  rotate: boolean;
  canRotate: boolean;
  offsetXMm: number;
  offsetYMm: number;
  pitchXMm: number;
  pitchYMm: number;
  breakageBuffer: number;
  onShape: (s: RoomShape) => void;
  onUnit: (u: LengthUnit) => void;
  onRoomWidth: (n: number) => void;
  onRoomHeight: (n: number) => void;
  onNotchWidth: (n: number) => void;
  onNotchHeight: (n: number) => void;
  onNotchCorner: (c: NotchCorner) => void;
  onGrout: (n: number) => void;
  onPattern: (p: Pattern) => void;
  onRotate: (v: boolean) => void;
  onOffsetX: (n: number) => void;
  onOffsetY: (n: number) => void;
  onBuffer: (n: number) => void;
  onMinimizeWaste: () => void;
  canMinimize?: boolean;
}) {
  const unitLabel = unit === "ft" ? "ft" : "m";
  const maxX = Math.max(0, Math.round(pitchXMm) - 1);
  const maxY = Math.max(0, Math.round(pitchYMm) - 1);

  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="space-y-6">
      {/* ── Quick Estimate (always visible) ── */}
      <section className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Room</p>
        <Segmented
          value={shape}
          onChange={onShape}
          options={[
            { id: "rectangle", label: "Rectangle" },
            { id: "l-shape", label: "L-shape" },
          ]}
        />
        <Segmented
          value={unit}
          onChange={onUnit}
          options={[
            { id: "ft", label: "Feet" },
            { id: "m", label: "Metres" },
          ]}
        />
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            id="room-width"
            label="Width"
            value={roomWidth}
            suffix={unitLabel}
            onChange={onRoomWidth}
          />
          <NumberField
            id="room-length"
            label="Length"
            value={roomHeight}
            suffix={unitLabel}
            onChange={onRoomHeight}
          />
        </div>

        {shape === "l-shape" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                id="notch-width"
                label="Notch width"
                value={notchWidth}
                suffix={unitLabel}
                onChange={onNotchWidth}
              />
              <NumberField
                id="notch-length"
                label="Notch length"
                value={notchHeight}
                suffix={unitLabel}
                onChange={onNotchHeight}
              />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                Missing corner
              </p>
              <div className="grid grid-cols-4 gap-1">
                {CORNERS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onNotchCorner(c.id)}
                    className={`min-h-9 text-[11px] font-bold rounded-lg border transition-colors ${
                      notchCorner === c.id
                        ? "bg-accent text-white border-accent"
                        : "bg-white text-gray-600 border-gray-200 hover:border-accent/40"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-2">
          <RoomSilhouette
            shape={shape}
            width={roomWidth}
            height={roomHeight}
            notchWidth={notchWidth}
            notchHeight={notchHeight}
            notchCorner={notchCorner}
          />
        </div>
      </section>

      {/* ── Pattern (always visible) ── */}
      <section className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Pattern</p>
        <Segmented
          value={pattern}
          onChange={onPattern}
          options={[
            { id: "straight", label: "Straight" },
            { id: "brick", label: "Brick" },
          ]}
        />
      </section>

      {/* ── Safety / Extra Spare Tiles (always visible) ── */}
      <section className="space-y-2">
        <label className="block">
          <span className="flex justify-between text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
            <span>Safety / Extra Spare Tiles</span>
            <span className="normal-case tracking-normal text-gray-400">{Math.round(breakageBuffer * 100)}%</span>
          </span>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={Math.round(breakageBuffer * 100)}
            onChange={(e) => onBuffer(Number(e.target.value) / 100)}
            className="w-full"
          />
        </label>
        <p className="text-[11px] text-gray-400 leading-relaxed">
          Add extra tiles for any on-site breakage. Cut waste is already included.
        </p>
      </section>

      {/* ── Advanced / Contractor Settings (collapsible accordion) ── */}
      <section>
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="w-full flex items-center justify-between gap-2 min-h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Advanced / Contractor Settings
          </span>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
              showAdvanced ? "rotate-180" : ""
            }`}
          />
        </button>

        <div
          className="overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out"
          style={{
            maxHeight: showAdvanced ? "800px" : "0px",
            opacity: showAdvanced ? 1 : 0,
          }}
        >
          <div className="pt-4 space-y-4">
            {/* Grout joint */}
            <NumberField
              id="grout"
              label="Grout joint"
              value={groutMm}
              min={0}
              step={0.5}
              suffix="mm"
              onChange={onGrout}
            />

            {/* Rotate tile */}
            <label className="flex items-center justify-between gap-3 min-h-11 px-3 rounded-xl border border-gray-200 bg-white">
              <span className="text-sm font-medium text-zinc-800">Rotate tile 90°</span>
              <input
                type="checkbox"
                checked={rotate}
                disabled={!canRotate}
                onChange={(e) => onRotate(e.target.checked)}
                className="h-4 w-4 accent-[var(--accent,#b45309)]"
              />
            </label>
            {!canRotate && (
              <p className="text-[11px] text-gray-400">Square tiles look the same when rotated.</p>
            )}

            {/* Shift Layout sliders */}
            <div className="space-y-2">
              <label className="block">
                <span className="flex justify-between text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  <span>Shift Layout X</span>
                  <span className="normal-case tracking-normal text-gray-400">{Math.round(offsetXMm)} mm</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={maxX}
                  value={Math.min(offsetXMm, maxX)}
                  onChange={(e) => onOffsetX(Number(e.target.value))}
                  className="w-full"
                />
              </label>
              <label className="block">
                <span className="flex justify-between text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  <span>Shift Layout Y</span>
                  <span className="normal-case tracking-normal text-gray-400">{Math.round(offsetYMm)} mm</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={maxY}
                  value={Math.min(offsetYMm, maxY)}
                  onChange={(e) => onOffsetY(Number(e.target.value))}
                  className="w-full"
                />
              </label>
            </div>

            {/* Minimize waste */}
            <button
              type="button"
              onClick={onMinimizeWaste}
              disabled={!canMinimize}
              className="w-full min-h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-accent/10 text-accent text-xs font-semibold uppercase tracking-widest hover:bg-accent hover:text-white transition-colors disabled:opacity-40 disabled:hover:bg-accent/10 disabled:hover:text-accent"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Minimize waste
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
