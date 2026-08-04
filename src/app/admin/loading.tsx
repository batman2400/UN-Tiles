import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="max-w-6xl mx-auto animate-pulse p-4">
      <div className="h-8 w-64 bg-gray-200 rounded-lg mb-2" />
      <div className="h-4 w-96 bg-gray-100 rounded mb-8" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="h-44 bg-white rounded-3xl border border-gray-100 p-6 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-center">
              <div className="w-10 h-10 bg-gray-100 rounded-2xl" />
              <div className="w-20 h-5 bg-gray-100 rounded-full" />
            </div>
            <div>
              <div className="h-4 w-24 bg-gray-100 rounded mb-2" />
              <div className="h-8 w-16 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
