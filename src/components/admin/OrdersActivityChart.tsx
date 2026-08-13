interface DayBucket {
  label: string;
  fullLabel: string;
  count: number;
}

/**
 * Lightweight inline-SVG bar chart — no charting library dependency needed
 * for a simple 14-day trend. Pure presentational (server-renderable);
 * per-bar tooltips are handled natively via SVG <title>.
 */
export function OrdersActivityChart({ data }: { data: DayBucket[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const width = 100;
  const height = 40;
  const barWidth = width / data.length;

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

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32" preserveAspectRatio="none">
        {data.map((d, i) => {
          const barHeight = (d.count / max) * (height - 4);
          const x = i * barWidth;
          const y = height - barHeight;
          return (
            <rect
              key={i}
              x={x + barWidth * 0.15}
              y={y}
              width={barWidth * 0.7}
              height={Math.max(barHeight, d.count > 0 ? 1 : 0.5)}
              rx={0.8}
              className={d.count > 0 ? "fill-accent" : "fill-gray-100"}
            >
              <title>{`${d.fullLabel}: ${d.count} order${d.count === 1 ? "" : "s"}`}</title>
            </rect>
          );
        })}
      </svg>

      <div className="flex justify-between mt-2">
        {data.map((d, i) => (
          <span
            key={i}
            className={`text-[9px] font-bold uppercase tracking-wider text-gray-400 ${i % 2 !== 0 ? "hidden sm:inline" : ""}`}
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
