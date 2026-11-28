import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TopNavBar } from "@/components/TopNavBar";
import { Footer } from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <TopNavBar />
      <section className="min-h-[calc(100svh-6rem)] flex items-center justify-center bg-surface px-4 sm:px-6 pt-28 sm:pt-32 pb-16">
        <div className="text-center max-w-md motion-fade-up">
          <p className="text-sm uppercase tracking-[0.2em] text-accent font-semibold mb-4">404</p>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-on-surface mb-4">
            Page Not Found
          </h1>
          <p className="text-sm text-on-surface-variant mb-8 leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="kinetic-button inline-flex w-full sm:w-auto items-center justify-center gap-3 bg-primary hover:bg-primary-dim text-on-primary py-3.5 px-7 rounded-xl text-xs font-semibold uppercase tracking-widest transition-colors"
            >
              <span>Back to Home</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/collections"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 border border-outline/40 bg-surface-container-lowest hover:border-accent hover:text-accent text-on-surface py-3.5 px-7 rounded-xl text-xs font-semibold uppercase tracking-widest transition-colors"
            >
              <span>Browse Collections</span>
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
