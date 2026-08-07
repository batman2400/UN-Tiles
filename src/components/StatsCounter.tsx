"use client";

import { useEffect, useRef, useState } from "react";

type StatsCounterProps = {
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  label: string;
};

export function StatsCounter({
  end,
  suffix = "",
  prefix = "",
  duration = 2000,
  label,
}: StatsCounterProps) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    const startTime = performance.now();
    let rafId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [hasStarted, end, duration]);

  return (
    <div ref={ref} className="text-center transition-all duration-700">
      <div className={`text-4xl md:text-5xl font-display font-bold tracking-tight mb-2 text-zinc-900 transition-transform duration-500 ${
        hasStarted ? "scale-100 opacity-100" : "scale-90 opacity-0"
      }`}>
        {prefix}{count}{suffix}
      </div>
      <div className="text-xs md:text-sm uppercase tracking-widest font-semibold text-slate-600">
        {label}
      </div>
    </div>
  );
}
