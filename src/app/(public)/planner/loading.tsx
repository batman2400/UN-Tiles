import Image from "next/image";

export default function PlannerLoading() {
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
          <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight text-white mb-3">
            Plan the room. Cut the waste.
          </h1>
          <p className="text-white/70 text-sm max-w-2xl">Loading catalog…</p>
        </div>
      </section>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full py-6 sm:py-10">
        <div className="flex flex-col lg:flex-row gap-10">
          <aside className="w-full lg:w-80 h-[32rem] rounded-2xl bg-white border border-gray-100 animate-pulse" />
          <div className="flex-1 aspect-[4/3] rounded-2xl bg-surface-container animate-pulse" />
        </div>
      </div>
    </div>
  );
}
