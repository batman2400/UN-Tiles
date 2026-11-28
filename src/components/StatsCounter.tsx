"use client";

import { useEffect, useRef, useState } from "react";

type StatsCounterProps = {
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  label: string;
  dark?: boolean;
};

export function StatsCounter({
  end,
  suffix = "",
  prefix = "",
  duration = 900,
  label,
  dark = false,
}: StatsCounterProps) {
  const [count, setCount] = useState(end);
  const hasAnimatedRef = useRef(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || hasAnimatedRef.current) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) {
      hasAnimatedRef.current = true;
      return;
    }

    let rafId: number | undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimatedRef.current) {
          hasAnimatedRef.current = true;
          observer.unobserve(el);

          const startCount = end <= 10 ? end : Math.max(1, Math.round(end * 0.6));
          if (startCount === end) return;

          const startTime = performance.now();
          const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(startCount + eased * (end - startCount)));

            if (progress < 1) {
              rafId = requestAnimationFrame(tick);
            }
          };

          rafId = requestAnimationFrame(tick);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (rafId !== undefined) cancelAnimationFrame(rafId);
    };
  }, [end, duration]);

  return (
    <div ref={ref} className="text-center transition-all duration-500">
      <div
        className={`text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight mb-2 ${
          dark ? "text-white" : "text-zinc-900"
        }`}
      >
        {prefix}{count}{suffix}
      </div>
      <div
        className={`text-xs md:text-sm uppercase tracking-widest font-semibold ${
          dark ? "text-white/60" : "text-slate-600"
        }`}
      >
        {label}
      </div>
    </div>
  );
}
