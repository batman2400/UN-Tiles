import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <section className="min-h-[calc(100vh-6rem)] flex items-center justify-center bg-surface px-6 pt-32 pb-16">
      <div className="text-center max-w-md motion-fade-up">
        <p className="text-sm uppercase tracking-[0.2em] text-accent font-semibold mb-4">404</p>
        <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-on-surface mb-4">
          Page Not Found
        </h1>
        <p className="text-sm text-on-surface-variant mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
        </p>
        <Link
          href="/"
          className="kinetic-button inline-flex items-center justify-center gap-3 bg-primary hover:bg-primary-dim text-on-primary py-4 px-8 text-sm font-semibold uppercase tracking-widest transition-colors"
        >
          <span>Back to Home</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
