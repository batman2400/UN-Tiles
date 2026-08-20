"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Upload,
  Camera,
  ImageIcon,
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
  Filter,
} from "lucide-react";
import { VisualMatchCard } from "@/components/visual-search/VisualMatchCard";
import { SceneBriefPanel } from "@/components/visual-search/SceneBriefPanel";
import { compressImageForUpload } from "@/lib/visual-search/client-compress";
import type { MatchedProduct, SceneBrief } from "@/lib/visual-search/types";

type SearchMode = "matcher" | "advisor";

const CATEGORY_TABS = [
  { id: "all", label: "All Matches" },
  { id: "floor", label: "Floor Tiles" },
  { id: "wall", label: "Wall Tiles" },
  { id: "mosaics", label: "Mosaics" },
  { id: "pool-tiles", label: "Pool Tiles" },
];

export function VisualSearchClient({ visionEnabled }: { visionEnabled: boolean }) {
  const [mode, setMode] = useState<SearchMode>("matcher");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [matches, setMatches] = useState<MatchedProduct[] | null>(null);
  const [sceneBrief, setSceneBrief] = useState<SceneBrief | null>(null);
  const [queryTimeMs, setQueryTimeMs] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const activePreviewUrlRef = useRef<string | null>(null);

  const advisorLocked = mode === "advisor" && !visionEnabled;

  // Cleanup object URLs on unmount to prevent mobile Safari memory leaks
  useEffect(() => {
    return () => {
      if (activePreviewUrlRef.current) {
        URL.revokeObjectURL(activePreviewUrlRef.current);
      }
    };
  }, []);

  const handleFileSelect = async (file: File) => {
    setError(null);
    setIsCompressing(true);

    try {
      // Clean up previous preview URL
      if (activePreviewUrlRef.current) {
        URL.revokeObjectURL(activePreviewUrlRef.current);
        activePreviewUrlRef.current = null;
      }

      // Fast client-side downscale and compression (~40ms in browser)
      const compressed = await compressImageForUpload(file, {
        maxEdge: 1536,
        quality: 0.85,
      });

      setSelectedFile(compressed.file);
      setPreviewUrl(compressed.previewUrl);
      activePreviewUrlRef.current = compressed.previewUrl;

      setMatches(null);
      setSceneBrief(null);
    } catch (err: unknown) {
      console.error("[VisualSearch] Compression error:", err);
      setError("Could not process this photo. Please try another image.");
    } finally {
      setIsCompressing(false);
    }
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
    if (activePreviewUrlRef.current) {
      URL.revokeObjectURL(activePreviewUrlRef.current);
      activePreviewUrlRef.current = null;
    }
    setPreviewUrl(null);
    setMatches(null);
    setSceneBrief(null);
    setError(null);
    setQueryTimeMs(null);
    setSelectedCategory("all");
  };

  const handleSearch = async () => {
    if (!selectedFile || advisorLocked) return;

    setIsLoading(true);
    setError(null);
    setMatches(null);
    setSceneBrief(null);
    setSelectedCategory("all");

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

      const raw = await response.text();
      let data: {
        success?: boolean;
        error?: string;
        matches?: MatchedProduct[];
        scene?: SceneBrief;
        queryTimeMs?: number;
      };

      try {
        data = JSON.parse(raw) as typeof data;
      } catch {
        if (response.status === 404) {
          throw new Error("Visual Match is not configured on this deployment yet.");
        } else if (response.status === 413) {
          throw new Error("Image payload too large. Please select a smaller photo.");
        } else {
          throw new Error(
            "The AI matcher encountered a server error. Please ensure GEMINI_EMBED_API_KEY and SUPABASE_SERVICE_ROLE_KEY are configured in your Vercel Project Settings."
          );
        }
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Visual search failed. Please try again.");
      }

      if (Array.isArray(data.matches)) {
        setMatches(data.matches);
      }
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

  const categoryCounts = useMemo(() => {
    if (!matches) return {};
    const counts: Record<string, number> = { all: matches.length };
    for (const m of matches) {
      counts[m.categorySlug] = (counts[m.categorySlug] || 0) + 1;
    }
    return counts;
  }, [matches]);

  const filteredMatches = useMemo(() => {
    if (!matches) return [];
    if (selectedCategory === "all") return matches;
    return matches.filter((m) => m.categorySlug === selectedCategory);
  }, [matches, selectedCategory]);

  return (
    <div className="min-h-screen bg-background text-on-surface pt-24 sm:pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10 sm:space-y-12">
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Multimodal Visual Search</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-display font-bold tracking-tight text-on-surface">
            Find Your Perfect Tile Match
          </h1>

          <p className="text-sm sm:text-lg text-on-surface-variant leading-relaxed">
            Upload an inspiration photo, material texture, or a picture of your room.
            Our Gemini AI vector matcher instantly pairs it with our curated catalog.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 sm:p-1.5 rounded-2xl bg-surface-container border border-outline/30 premium-shadow max-w-full">
            <button
              type="button"
              onClick={() => {
                setMode("matcher");
                setMatches(null);
                setSceneBrief(null);
                setError(null);
              }}
              className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-7 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                mode === "matcher"
                  ? "bg-primary text-on-primary shadow-md"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span>Tile Matcher</span>
              <span className="hidden md:inline text-[10px] opacity-75 font-normal">
                (Material & Pattern)
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("advisor");
                setMatches(null);
                setSceneBrief(null);
                setError(null);
              }}
              className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-7 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                mode === "advisor"
                  ? "bg-primary text-on-primary shadow-md"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Home className="w-4 h-4 shrink-0" />
              <span>Scene Advisor</span>
              <span className="hidden md:inline text-[10px] opacity-75 font-normal">
                (Room & Lighting)
              </span>
            </button>
          </div>
        </div>

        {/* Main Upload / Search Card */}
        <div className="max-w-2xl mx-auto bg-surface-container-lowest border border-outline/40 rounded-3xl p-5 sm:p-8 premium-shadow-lg transition-all">
          <div className="space-y-6">
            {/* Context Info Banner */}
            <div className="flex items-start gap-3 bg-surface-container/60 p-3.5 rounded-2xl text-xs text-on-surface-variant border border-outline/20">
              <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <p>
                {mode === "matcher"
                  ? "Upload a tile photo, material crop, texture, or pattern swatch. We will match its color, veining, and visual texture against catalog tiles."
                  : visionEnabled
                    ? "Upload a photo of a hall, dining room, living room, kitchen, bathroom, or outdoor space. Indoor rooms get floor or wall tiles — never pool mosaics."
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
            ) : isCompressing ? (
              <div className="rounded-2xl border-2 border-dashed border-outline/40 p-10 text-center flex flex-col items-center justify-center gap-3 bg-surface-container/30">
                <RefreshCw className="w-6 h-6 text-accent animate-spin" />
                <p className="text-xs text-on-surface-variant font-medium">Loading photo...</p>
              </div>
            ) : !previewUrl ? (
              <div className="space-y-4">
                {/* Drag and Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`group relative border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center transition-all duration-300 flex flex-col items-center justify-center gap-3 ${
                    isDragging
                      ? "border-accent bg-accent/5 scale-[1.01]"
                      : "border-outline hover:border-accent hover:bg-surface-container/40"
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:text-accent group-hover:scale-110 transition-all duration-300">
                    <Upload className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm sm:text-base font-semibold text-on-surface">
                      Select or snap a photo of any tile or space
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      Supports iPhone photos, JPEG, PNG, or WebP
                    </p>
                  </div>

                  {/* Mobile-Friendly Action Buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2 w-full max-w-sm">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-black transition-all shadow-sm active:scale-95"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Take Photo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-surface-container border border-outline/30 text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-all active:scale-95"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>Choose Photo</span>
                    </button>
                  </div>
                </div>

                {/* Hidden File Inputs */}
                {/* Standard File Picker */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                      e.target.value = "";
                    }
                  }}
                />

                {/* Camera Capture File Picker for Mobile */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                      e.target.value = "";
                    }
                  }}
                />
              </div>
            ) : (
              <div className="space-y-3">
                {/* Image Preview Container with Smooth Hardware-Accelerated Scanner */}
                <div className="relative rounded-2xl overflow-hidden bg-surface-container border border-outline/30 aspect-4/3 max-h-80 mx-auto group transform-gpu">
                  <Image
                    src={previewUrl}
                    alt="Search upload preview"
                    fill
                    unoptimized
                    className="object-contain"
                  />

                  {/* Clear Button */}
                  {!isLoading && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black text-white backdrop-blur-sm border border-white/20 transition-all z-20"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  {/* GPU-Isolated Smooth Scanning Overlay (Zero Screen Blinking) */}
                  {isLoading && (
                    <div className="absolute inset-0 bg-black/65 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-4 z-30 transform-gpu will-change-transform">
                      {/* Scanning Radar Line */}
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_15px_rgba(251,191,36,0.9)] animate-pulse" />

                      {/* Smooth Center AI Spinner */}
                      <div className="relative w-14 h-14 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin" />
                        <Scan className="w-5 h-5 text-amber-300 absolute" />
                      </div>

                      <div className="text-center px-4 space-y-1">
                        <p className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-amber-200">
                          {mode === "matcher"
                            ? "Matching 768-D Vector Embeddings..."
                            : "Analyzing Space & Designing Brief..."}
                        </p>
                        <p className="text-[11px] text-stone-300">
                          Searching curated UN Tiles catalog
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 p-4 rounded-xl text-xs sm:text-sm text-red-700 dark:text-red-300">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Visual Search Notice</p>
                  <p className="text-xs opacity-90 leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            {/* Search Action Buttons */}
            {previewUrl && !advisorLocked && (
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={isLoading || isCompressing}
                  className="flex-1 py-3.5 px-6 rounded-xl bg-primary text-on-primary font-semibold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-black transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
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
                  type="button"
                  onClick={handleReset}
                  disabled={isLoading || isCompressing}
                  className="py-3.5 px-5 rounded-xl border border-outline text-on-surface text-xs font-semibold uppercase tracking-wider hover:bg-surface-container transition-all disabled:opacity-50"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Scene Advisor Output */}
        {sceneBrief && (
          <div className="space-y-6 pt-4">
            <SceneBriefPanel brief={sceneBrief} />
          </div>
        )}

        {/* Catalog Match Results */}
        {matches && (
          <div className="space-y-6 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline/30 pb-4">
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

            {/* Category Filter Pills */}
            {matches.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1 pb-2">
                {CATEGORY_TABS.map((tab) => {
                  const count = categoryCounts[tab.id] || 0;
                  if (tab.id !== "all" && count === 0) return null;
                  const isActive = selectedCategory === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedCategory(tab.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        isActive
                          ? "bg-primary text-on-primary shadow-sm"
                          : "bg-surface-container/70 text-on-surface-variant hover:bg-surface-container hover:text-on-surface border border-outline/30"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-surface text-on-surface-variant"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {filteredMatches.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {filteredMatches.map((product, index) => (
                  <VisualMatchCard
                    key={product.id}
                    product={product}
                    rank={index + 1}
                    priority={index < 4}
                  />
                ))}
              </div>
            ) : matches.length > 0 ? (
              <div className="text-center py-10 space-y-3 bg-surface-container/30 rounded-3xl p-6 border border-outline/20">
                <p className="text-sm text-on-surface-variant">
                  No matches in the <strong className="text-on-surface capitalize">{selectedCategory.replace("-", " ")}</strong> category.
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold uppercase tracking-wider hover:bg-black transition-all"
                >
                  View All {matches.length} Matches
                </button>
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

        {/* Footer Disclaimer */}
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
