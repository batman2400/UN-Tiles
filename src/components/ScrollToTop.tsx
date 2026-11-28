"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScrollToTop() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  const hiddenOnRoute = pathname.startsWith("/cart");

  useEffect(() => {
    if (hiddenOnRoute) return;

    const toggleVisibility = () => {
      const scrolledPastFold = window.scrollY > 300;
      const nearBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 160;
      setIsVisible(scrolledPastFold && !nearBottom);
    };

    toggleVisibility();
    window.addEventListener("scroll", toggleVisibility, { passive: true });
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, [hiddenOnRoute]);

  if (hiddenOnRoute) return null;

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={cn(
        "fixed bottom-5 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900/85 backdrop-blur-md border border-white/20 text-white shadow-lg transition-all duration-300 hover:bg-zinc-900 hover:scale-110 active:scale-95 sm:hidden",
        isVisible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-12 opacity-0 pointer-events-none"
      )}
    >
      <ArrowUp className="h-4 w-4" />
    </button>
  );
}
