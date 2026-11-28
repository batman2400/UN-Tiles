interface DayBucket {
  label: string;
  fullLabel: string;
  count: number;
}

/**
 * Lightweight HTML/CSS flex bar chart — unstretched crisp corners across all
 * screen widths with native hover titles and server-renderable markup.
 */
export function OrdersActivityChart({ data }: { data: DayBucket[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 sm:p-6 md:p-8 motion-fade-up motion-delay-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Order Activity</h3>
          <p className="text-xs text-gray-500 mt-1">Orders placed per day, last 14 days</p>
        </div>
        <span className="text-2xl font-mono font-light text-gray-900">
          {data.reduce((sum, d) => sum + d.count, 0)}
        </span>
      </div>

      <div
        className="h-32 flex items-end gap-1.5 sm:gap-2"
        role="img"
        aria-label="14-day order activity bar chart"
      >
        {data.map((d, i) => {
          const pct = (d.count / max) * 100;
          const heightPct = d.count > 0 ? Math.max(pct, 8) : 4;
          return (
            <div
              key={i}
              title={`${d.fullLabel}: ${d.count} order${d.count === 1 ? "" : "s"}`}
              className="flex-1 h-full flex items-end group"
            >
              <div
                style={{ height: `${heightPct}%` }}
                className={`w-full rounded-t-md transition-all duration-300 ${
                  d.count > 0
                    ? "bg-accent group-hover:bg-zinc-900"
                    : "bg-gray-100 group-hover:bg-gray-200"
                }`}
              />
            </div>
          );
        })}
      </div>

      <div className="flex gap-1.5 sm:gap-2 mt-2">
        {data.map((d, i) => (
          <span
            key={i}
            className={`flex-1 text-center text-[9px] font-bold uppercase tracking-wider text-gray-400 ${
              i % 2 !== 0 ? "hidden sm:block" : ""
            }`}
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
