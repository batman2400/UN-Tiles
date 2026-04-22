"use client";

import { useEffect, useRef } from "react";

type ParallaxLayerProps = {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  maxOffset?: number;
};

export function ParallaxLayer({
  children,
  className,
  speed = 0.14,
  maxOffset = 48,
}: ParallaxLayerProps) {
  const layerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) {
      return;
    }

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotionQuery.matches) {
      layer.style.setProperty("--parallax-offset", "0px");
      return;
    }

    let rafId = 0;

    const updateOffset = () => {
      const rect = layer.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const layerCenter = rect.top + rect.height / 2;
      const rawOffset = (viewportCenter - layerCenter) * speed;
      const offset = Math.max(-maxOffset, Math.min(maxOffset, rawOffset));

      layer.style.setProperty("--parallax-offset", `${offset.toFixed(2)}px`);
      rafId = 0;
    };

    const onScrollOrResize = () => {
      if (rafId !== 0) {
        return;
      }

      rafId = window.requestAnimationFrame(updateOffset);
    };

    updateOffset();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
      }

      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [maxOffset, speed]);

  return (
    <div
      ref={layerRef}
      className={`parallax-layer ${className ?? ""}`.trim()}
    >
      {children}
    </div>
  );
}