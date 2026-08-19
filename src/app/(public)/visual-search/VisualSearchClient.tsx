"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Upload,
  Sparkles,
  Layers,
  Home,
  RefreshCw,
  AlertCircle,
  Clock,
  ArrowRight,
  Info,
  X,
  Scan,
} from "lucide-react";
import { VisualMatchCard } from "@/components/visual-search/VisualMatchCard";
import { SceneBriefPanel } from "@/components/visual-search/SceneBriefPanel";
import type { MatchedProduct, SceneBrief } from "@/lib/visual-search/types";

type SearchMode = "matcher" | "advisor";

export function VisualSearchClient({ visionEnabled }: { visionEnabled: boolean }) {
  const [mode, setMode] = useState<SearchMode>("matcher");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [matches, setMatches] = useState<MatchedProduct[] | null>(null);
  const [sceneBrief, setSceneBrief] = useState<SceneBrief | null>(null);
  const [queryTimeMs, setQueryTimeMs] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const advisorLocked = mode === "advisor" && !visionEnabled;

  const handleFileSelect = (file: File) => {
    setError(null);
    if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
      setError("Please upload a valid image (JPEG, PNG, or WebP).");
      return;
    }
    if (file.size > 4.5 * 1024 * 1024) {
      setError("Image size exceeds 4.5MB. Please upload a smaller photo.");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setMatches(null);
    setSceneBrief(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (advisorLocked) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setMatches(null);
    setSceneBrief(null);
    setError(null);
    setQueryTimeMs(null);
  };

  const handleSearch = async () => {
    if (!selectedFile || advisorLocked) return;

    setIsLoading(true);
    setError(null);
    setMatches(null);
    setSceneBrief(null);

    const formData = new FormData();
    formData.append("image", selectedFile);

    const endpoint =
      mode === "matcher"
        ? "/api/visual-search/match"
        : "/api/visual-search/scene";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Visual search failed. Please try again.");
      }

      setMatches(data.matches || []);
      if (data.scene) {
        setSceneBrief(data.scene);
      }
      if (typeof data.queryTimeMs === "number") {
        setQueryTimeMs(data.queryTimeMs);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred during visual matching.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface pt-24 sm:pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Multimodal Visual Search</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-display font-bold tracking-tight text-on-surface">
            Find Your Perfect Tile Match
          </h1>

          <p className="text-base sm:text-lg text-on-surface-variant leading-relaxed">
            Upload an inspiration photo, material texture, or a picture of your room.
            Our Gemini AI vector matcher instantly pairs it with our curated catalog.
          </p>
        </div>

        <div className="flex justify-center">
          <div className="inline-flex p-1.5 rounded-2xl bg-surface-container border border-outline/30 premium-shadow">
            <button
              onClick={() => {
                setMode("matcher");
                setMatches(null);
                setSceneBrief(null);
                setError(null);
              }}
              className={`flex items-center gap-2 px-5 sm:px-7 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                mode === "matcher"
                  ? "bg-primary text-on-primary shadow-md"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Tile Matcher</span>
              <span className="hidden sm:inline text-[10px] opacity-75 font-normal">
                (Material & Pattern)
              </span>
            </button>

            <button
              onClick={() => {
                setMode("advisor");
                setMatches(null);
                setSceneBrief(null);
                setError(null);
              }}
              className={`flex items-center gap-2 px-5 sm:px-7 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                mode === "advisor"
                  ? "bg-primary text-on-primary shadow-md"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Scene Advisor</span>
              <span className="hidden sm:inline text-[10px] opacity-75 font-normal">
                (Room & Lighting)
              </span>
            </button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto bg-surface-container-lowest border border-outline/40 rounded-3xl p-6 sm:p-8 premium-shadow-lg transition-all">
          <div className="space-y-6">
            <div className="flex items-start gap-3 bg-surface-container/60 p-3.5 rounded-2xl text-xs text-on-surface-variant border border-outline/20">
              <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <p>
                {mode === "matcher"
                  ? "Upload a tile photo, material crop, texture, or pattern swatch. We will match its color, veining, and visual texture against catalog tiles."
                  : visionEnabled
                    ? "Upload a photo of your bathroom, kitchen, living room, or outdoor space. We will extract the architectural theme and recommend harmonizing tiles."
                    : "Scene Advisor is not enabled yet. Use Tile Matcher to find similar catalog tiles from a design or material photo."}
              </p>
            </div>

            {advisorLocked ? (
              <div className="rounded-2xl border border-dashed border-outline p-8 sm:p-12 text-center space-y-3 bg-surface-container/30">
                <Home className="w-8 h-8 mx-auto text-on-surface-variant" />
                <p className="text-sm font-semibold text-on-surface">Scene Advisor coming online</p>
                <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                  Room analysis will be available once the vision model is connected. Tile Matcher is ready now.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setMode("matcher");
                    setError(null);
                  }}
                  className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold uppercase tracking-wider hover:bg-black transition-all"
                >
                  <Layers className="w-4 h-4" />
                  Open Tile Matcher
                </button>
              </div>
            ) : !previewUrl ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`group relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-4 ${
                  isDragging
                    ? "border-accent bg-accent/5 scale-[1.01]"
                    : "border-outline hover:border-accent hover:bg-surface-container/40"
                }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:text-accent group-hover:scale-110 transition-all duration-300">
                  <Upload className="w-7 h-7" />
                </div>

                <div className="space-y-1.5">
                  <p className="text-sm sm:text-base font-semibold text-on-surface">
                    Drag and drop your photo here, or{" "}
                    <span className="text-accent underline underline-offset-4">browse files</span>
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Supports JPEG, PNG, or WebP (up to 4.5 MB)
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-surface-container border border-outline/30 aspect-4/3 max-h-80 mx-auto group">
                <Image
                  src={previewUrl}
                  alt="Search upload preview"
                  fill
                  unoptimized
                  className="object-contain"
                />

                {!isLoading && (
                  <button
                    onClick={handleReset}
                    className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black text-white backdrop-blur-md border border-white/20 transition-all"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {isLoading && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-3 z-30">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-2 border-amber-400/30 animate-ping" />
                      <div className="w-12 h-12 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                      <Scan className="w-5 h-5 text-amber-300 absolute" />
                    </div>
                    <p className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-amber-200">
                      {mode === "matcher"
                        ? "Generating 768-D Vector Embeddings..."
                        : "Analyzing Space & Designing Brief..."}
                    </p>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 p-4 rounded-xl text-xs sm:text-sm text-red-700 dark:text-red-300">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {previewUrl && !advisorLocked && (
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="flex-1 py-3.5 px-6 rounded-xl bg-primary text-on-primary font-semibold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-black transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{mode === "matcher" ? "Find Matching Tiles" : "Get Scene Advice"}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleReset}
                  disabled={isLoading}
                  className="py-3.5 px-4 rounded-xl border border-outline text-on-surface text-xs font-semibold uppercase tracking-wider hover:bg-surface-container transition-all"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>

        {sceneBrief && (
          <div className="space-y-6 pt-4">
            <SceneBriefPanel brief={sceneBrief} />
          </div>
        )}

        {matches && (
          <div className="space-y-6 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline/30 pb-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-accent font-semibold">
                  Catalog Matches
                </p>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-on-surface">
                  {matches.length > 0
                    ? `Top ${matches.length} Recommended Tiles`
                    : "No Direct Matches Found"}
                </h2>
              </div>

              {queryTimeMs !== null && (
                <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Matched in {queryTimeMs}ms</span>
                </div>
              )}
            </div>

            {matches.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {matches.map((product, index) => (
                  <VisualMatchCard
                    key={product.id}
                    product={product}
                    rank={index + 1}
                    priority={index < 4}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-4 bg-surface-container/30 rounded-3xl p-8 border border-outline/20">
                <p className="text-base text-on-surface-variant">
                  We could not find an exact tile match for this image. Try uploading a clearer photo or browsing our full collection.
                </p>
                <Link
                  href="/collections"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary text-xs font-semibold uppercase tracking-wider hover:bg-black transition-all"
                >
                  <span>Explore Full Catalog</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="border-t border-outline/30 pt-8 mt-16 max-w-4xl mx-auto text-center space-y-2 text-xs text-on-surface-variant leading-relaxed">
          <p>
            <strong>Note:</strong> AI visual match rankings are generated via Google Gemini multimodal embeddings and provide design inspiration. Because lighting, screen calibration, and glaze finishes vary, we recommend confirming exact tile colors and surface textures at our UN Tiles showroom before placing large orders.
          </p>
          <p className="text-[11px] opacity-75">
            Uploaded search images are processed securely using the Google AI Studio Gemini API in accordance with our terms of service.
          </p>
        </div>
      </div>
    </div>
  );
}
