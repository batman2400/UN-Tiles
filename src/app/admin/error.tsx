"use client";

import { AlertTriangle } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="bg-white rounded-2xl border border-red-100 p-8 text-center shadow-sm animate-[page-enter_300ms_ease-out]">
        <div className="w-14 h-14 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Dashboard Error</h2>
        <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
          {error.message || "An unexpected error occurred while loading this page."}
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-bold hover:bg-yellow-500 hover:text-black transition-all active:scale-95"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
