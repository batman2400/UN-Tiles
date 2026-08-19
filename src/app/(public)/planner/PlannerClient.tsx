"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import type { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import type { BestFitCandidate } from "@/lib/tile-planner";
import {
  findBestFitTiles,
  minimizeWaste,
  parseDimensions,
  planRoom,
  productHasParsableSize,
  roomFromInput,
  type LengthUnit,
  type NotchCorner,
  type Pattern,
  type RoomShape,
} from "@/lib/tile-planner";
import { BestFitSuggestion } from "@/components/planner/BestFitSuggestion";
import { LayoutCanvas } from "@/components/planner/LayoutCanvas";
import { ProductPicker } from "@/components/planner/ProductPicker";
import { ResultsPanel } from "@/components/planner/ResultsPanel";
import { RoomInputs } from "@/components/planner/RoomInputs";

function roundTo(n: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

function convertLength(value: number, from: LengthUnit, to: LengthUnit): number {
  if (from === to) return value;
  if (!Number.isFinite(value)) return value;
  return from === "ft" ? roundTo(value * 0.3048, 3) : roundTo(value / 0.3048, 2);
}

export function PlannerClient({
  products,
  initialProductId,
}: {
  products: Product[];
  initialProductId?: string;
}) {
  const { addToCart, items } = useCart();

  const plannable = useMemo(
    () => products.filter((p) => productHasParsableSize(p.dimensions)),
    [products]
  );

  const urlProduct = initialProductId || "";
  const defaultId =
    (urlProduct && plannable.some((p) => p.id === urlProduct) ? urlProduct : null) ??
    plannable[0]?.id ??
    null;

  const [selectedId, setSelectedId] = useState<string | null>(defaultId);
  const [shape, setShape] = useState<RoomShape>("rectangle");
  const [unit, setUnit] = useState<LengthUnit>("ft");
  const [roomWidth, setRoomWidth] = useState(10);
  const [roomHeight, setRoomHeight] = useState(12);
  const [notchWidth, setNotchWidth] = useState(4);
  const [notchHeight, setNotchHeight] = useState(4);
  const [notchCorner, setNotchCorner] = useState<NotchCorner>("NW");
  const [groutMm, setGroutMm] = useState(2);
  const [pattern, setPattern] = useState<Pattern>("straight");
  const [rotate, setRotate] = useState(false);
  const [offsetXMm, setOffsetXMm] = useState(0);
  const [offsetYMm, setOffsetYMm] = useState(0);
  const [breakageBuffer, setBreakageBuffer] = useState(0);
  const [justAdded, setJustAdded] = useState(false);

  const selected = plannable.find((p) => p.id === selectedId) ?? null;
  const tileSize = selected ? parseDimensions(selected.dimensions) : null;
  const canRotate = Boolean(tileSize && tileSize.widthMm !== tileSize.heightMm);

  const tileWidthMm = tileSize?.widthMm ?? 0;
  const tileHeightMm = tileSize?.heightMm ?? 0;

  const plannerInput = useMemo(() => {
    if (tileWidthMm < 1 || tileHeightMm < 1) return null;
    return {
      tileWidthMm,
      tileHeightMm,
      roomWidth: Number.isFinite(roomWidth) ? roomWidth : 0,
      roomHeight: Number.isFinite(roomHeight) ? roomHeight : 0,
      unit,
      shape,
      notchWidth: Number.isFinite(notchWidth) ? notchWidth : 0,
      notchHeight: Number.isFinite(notchHeight) ? notchHeight : 0,
      notchCorner,
      groutMm: Number.isFinite(groutMm) ? Math.max(0, groutMm) : 0,
      pattern,
      rotate: canRotate && rotate,
      offsetXMm,
      offsetYMm,
      breakageBuffer,
    };
  }, [
    tileWidthMm,
    tileHeightMm,
    roomWidth,
    roomHeight,
    unit,
    shape,
    notchWidth,
    notchHeight,
    notchCorner,
    groutMm,
    pattern,
    rotate,
    canRotate,
    offsetXMm,
    offsetYMm,
    breakageBuffer,
  ]);

  const output = useMemo(
    () => (plannerInput ? planRoom(plannerInput) : null),
    [plannerInput]
  );
  const result = output?.ok ? output : null;
  const error = output && !output.ok ? output.error : null;

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setOffsetXMm(0);
    setOffsetYMm(0);
    setRotate(false);
    setJustAdded(false);
    const params = new URLSearchParams(window.location.search);
    params.set("product", id);
    window.history.replaceState(null, "", `/planner?${params.toString()}`);
  }, []);

  /** Switch from Smart Size Optimization – apply the optimized offsets/rotation. */
  const handleSwitchTile = useCallback((candidate: BestFitCandidate) => {
    setSelectedId(candidate.productId);
    setOffsetXMm(candidate.offsetXMm);
    setOffsetYMm(candidate.offsetYMm);
    setRotate(candidate.rotate);
    setJustAdded(false);
    const params = new URLSearchParams(window.location.search);
    params.set("product", candidate.productId);
    window.history.replaceState(null, "", `/planner?${params.toString()}`);
  }, []);

  const handleUnit = useCallback(
    (next: LengthUnit) => {
      setRoomWidth((w) => convertLength(w, unit, next));
      setRoomHeight((h) => convertLength(h, unit, next));
      setNotchWidth((w) => convertLength(w, unit, next));
      setNotchHeight((h) => convertLength(h, unit, next));
      setUnit(next);
    },
    [unit]
  );

  const handleMinimizeWaste = useCallback(() => {
    if (!plannerInput || tileWidthMm < 1 || tileHeightMm < 1 || !output?.ok) return;
    const room = roomFromInput(plannerInput);
    if (!room) return;
    const best = minimizeWaste({
      room,
      tileWidthMm,
      tileHeightMm,
      groutMm: plannerInput.groutMm,
      pattern,
      allowRotate: canRotate,
      breakageBuffer,
    });
    setRotate(best.rotate);
    setOffsetXMm(best.offsetXMm);
    setOffsetYMm(best.offsetYMm);
  }, [plannerInput, tileWidthMm, tileHeightMm, pattern, canRotate, breakageBuffer, output]);

  const inCart = items.find((i) => i.id === selected?.id)?.cartQuantitySqft ?? 0;
  const recommended = result?.recommendedSqft ?? 0;
  let disabledReason: string | null = null;
  if (!selected || !result) disabledReason = "Choose a tile and a valid room to add to cart.";
  else if (selected.stockSqft <= 0) disabledReason = "This tile is out of stock.";
  else if (recommended <= 0) disabledReason = "Nothing to add for this layout.";
  else if (recommended > selected.stockSqft) {
    disabledReason = `Only ${selected.stockSqft} sq ft available in stock.`;
  } else if (inCart + recommended > selected.stockSqft) {
    disabledReason = `Cart already has ${inCart} sq ft. Only ${selected.stockSqft} sq ft in stock.`;
  }

  const handleAddToCart = useCallback(() => {
    if (!selected || !result || recommended <= 0) return;
    const added = addToCart(
      {
        id: selected.id,
        name: selected.name,
        image: selected.image,
        category: selected.category,
        price_per_sqft: selected.pricePerSqft,
        stockSqft: selected.stockSqft,
      },
      recommended
    );
    if (!added) {
      alert(
        `Cannot add more to cart. You may have reached the maximum available stock of ${selected.stockSqft} sqft.`
      );
      return;
    }
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1800);
  }, [addToCart, recommended, result, selected]);

  const bestFitCandidates = useMemo(() => {
    if (!result || !selected || !plannerInput) return [];
    const room = roomFromInput(plannerInput);
    if (!room) return [];
    return findBestFitTiles({
      room,
      groutMm: plannerInput.groutMm,
      pattern,
      breakageBuffer,
      currentProductId: selected.id,
      currentTileWidthMm: plannerInput.tileWidthMm,
      currentTileHeightMm: plannerInput.tileHeightMm,
      catalog: plannable.map((p) => ({
        id: p.id,
        name: p.name,
        dimensions: p.dimensions,
        image: p.image,
        category: p.category,
        pricePerSqft: p.pricePerSqft,
      })),
      currentWastePct: result.wastePct,
      currentCost: result.recommendedSqft * selected.pricePerSqft,
    });
  }, [result, selected, plannerInput, pattern, breakageBuffer, plannable]);

  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative h-[38vh] min-h-[260px] sm:h-[46vh] sm:min-h-[320px] flex items-end bg-background overflow-hidden">
        <Image
          src="/images/contact_hero_v6.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-40"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 via-60% to-background/90" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-8 sm:pb-10 w-full">
          <p className="text-xs uppercase tracking-[0.2em] text-accent font-semibold mb-2">
            Smart Tile Planner
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight text-white mb-3">
            Plan the room. Cut the waste.
          </h1>
          <p className="text-white/70 text-sm max-w-2xl">
            Lay a catalog tile over a rectangle or L-shaped room, see full tiles versus cuts, and add the recommended square footage to your cart.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full py-6 sm:py-10">
        {plannable.length === 0 ? (
          <p className="text-sm text-gray-500">
            No catalog tiles have a numeric size yet, so the planner cannot run.
          </p>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
            <aside className="w-full lg:w-80 xl:w-96 shrink-0 space-y-5">
              <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 space-y-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    Tile
                  </p>
                  <ProductPicker
                    products={plannable}
                    selectedId={selectedId}
                    onSelect={handleSelect}
                  />
                </div>
                <RoomInputs
                  shape={shape}
                  unit={unit}
                  roomWidth={roomWidth}
                  roomHeight={roomHeight}
                  notchWidth={notchWidth}
                  notchHeight={notchHeight}
                  notchCorner={notchCorner}
                  groutMm={groutMm}
                  pattern={pattern}
                  rotate={canRotate && rotate}
                  canRotate={canRotate}
                  offsetXMm={offsetXMm}
                  offsetYMm={offsetYMm}
                  pitchXMm={result?.pitchXMm ?? (tileSize ? tileSize.widthMm + groutMm : 100)}
                  pitchYMm={result?.pitchYMm ?? (tileSize ? tileSize.heightMm + groutMm : 100)}
                  breakageBuffer={breakageBuffer}
                  onShape={setShape}
                  onUnit={handleUnit}
                  onRoomWidth={setRoomWidth}
                  onRoomHeight={setRoomHeight}
                  onNotchWidth={setNotchWidth}
                  onNotchHeight={setNotchHeight}
                  onNotchCorner={setNotchCorner}
                  onGrout={setGroutMm}
                  onPattern={setPattern}
                  onRotate={setRotate}
                  onOffsetX={setOffsetXMm}
                  onOffsetY={setOffsetYMm}
                  onBuffer={setBreakageBuffer}
                  onMinimizeWaste={handleMinimizeWaste}
                  canMinimize={Boolean(result)}
                />
              </div>
            </aside>

            <div className="flex-1 min-w-0 space-y-5">
              {error && (
                <p className="rounded-xl border border-[#9f403d]/30 bg-[#9f403d]/8 px-4 py-3 text-sm text-[#9f403d]">
                  {error}
                </p>
              )}
              <LayoutCanvas result={result} />
              {result && selected && (
                <ResultsPanel
                  result={result}
                  pricePerSqft={selected.pricePerSqft}
                  stockSqft={selected.stockSqft}
                  onAddToCart={handleAddToCart}
                  justAdded={justAdded}
                  disabledReason={disabledReason}
                />
              )}
              {result && bestFitCandidates.length > 0 && (
                <BestFitSuggestion
                  candidates={bestFitCandidates}
                  currentWastePct={result.wastePct}
                  onSwitchTile={handleSwitchTile}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
