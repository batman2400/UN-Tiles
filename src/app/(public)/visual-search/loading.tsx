import Image from "next/image";

export default function VisualSearchLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* Hero Skeleton */}
      <section className="relative h-[38vh] min-h-[260px] sm:h-[46vh] sm:min-h-[320px] flex items-end bg-background overflow-hidden">
        <Image
          src="/images/contact_hero_v6.jpg"
          alt="Visual search loading"
          fill
          sizes="100vw"
          className="object-cover opacity-40"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 via-60% to-background/90" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-8 sm:pb-10 w-full">
          <p className="text-xs uppercase tracking-[0.2em] text-accent font-semibold mb-2">
            AI Architectural Intelligence
          </p>
          <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight text-white mb-3">
            Visual Tile Search
          </h1>
          <p className="text-white/70 text-sm max-w-2xl">
            Initializing neural vision and catalog index…
          </p>
        </div>
      </section>

      {/* Content Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Upload Area Skeleton */}
          <div className="lg:col-span-5 rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 sm:p-10 flex flex-col items-center justify-center min-h-[340px] animate-pulse">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 mb-4" />
            <div className="h-4 w-48 bg-slate-200 rounded mb-2" />
            <div className="h-3 w-64 bg-slate-100 rounded" />
          </div>

          {/* Results/Guidance Skeleton */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="h-28 rounded-2xl bg-white border border-slate-100 p-6 animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="aspect-[4/3] rounded-2xl bg-slate-100 animate-pulse" />
              <div className="aspect-[4/3] rounded-2xl bg-slate-100 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
