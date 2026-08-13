import Image from "next/image";

export default function CollectionsLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative h-[50vh] min-h-[350px] flex items-end bg-background overflow-hidden">
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
        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-10 w-full">
          <p className="text-xs uppercase tracking-[0.2em] text-accent font-semibold mb-2">
            All Collections
          </p>
          <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight text-white mb-3">
            The Collections
          </h1>
          <p className="text-white/70 text-sm max-w-2xl">
            Loading architectural slabs…
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 w-full py-10">
        <div className="mb-8 h-16 rounded-2xl bg-gray-50 border border-gray-200/80 animate-pulse" />
        <div className="flex flex-col md:flex-row gap-10">
          <aside className="w-full md:w-64 flex-shrink-0">
            <div className="h-80 rounded-2xl bg-white border border-gray-100 animate-pulse" />
          </aside>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="aspect-square rounded-2xl bg-surface-container animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
