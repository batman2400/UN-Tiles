"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function PublicError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="min-h-[calc(100svh-6rem)] flex items-center justify-center bg-surface px-4 sm:px-6 pt-28 sm:pt-32 pb-16">
      <div className="text-center max-w-md motion-fade-up">
        <div className="w-20 h-20 mx-auto mb-6 bg-[#9f403d]/10 text-[#9f403d] rounded-full flex items-center justify-center border border-[#9f403d]/20">
          <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-2xl font-display font-bold tracking-tight text-on-surface mb-3">
          Something went wrong
        </h2>
        <p className="text-sm text-on-surface-variant mb-8 leading-relaxed">
          We encountered an unexpected error. Please try again or return to the homepage.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="kinetic-button bg-primary hover:bg-primary-dim text-on-primary py-3 px-6 text-sm font-semibold uppercase tracking-widest transition-colors"
          >
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-widest text-on-surface-variant hover:text-on-surface py-3 px-6 transition-colors"
          >
            <span>Go Home</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
