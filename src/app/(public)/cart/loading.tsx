export default function CartLoading() {
  return (
    <div className="flex-1 bg-surface min-h-screen pt-28 sm:pt-32 pb-16 sm:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Title skeleton */}
        <div className="mb-8">
          <div className="h-4 w-24 bg-slate-200 rounded animate-pulse mb-3" />
          <div className="h-9 w-48 bg-slate-200 rounded-lg animate-pulse" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cart items list skeleton */}
          <div className="lg:col-span-8 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6 shadow-sm flex items-center gap-4 animate-pulse"
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-100 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-slate-200 rounded" />
                  <div className="h-3 w-1/4 bg-slate-100 rounded" />
                  <div className="h-4 w-1/5 bg-slate-200 rounded pt-2" />
                </div>
                <div className="w-24 h-9 bg-slate-100 rounded-xl" />
              </div>
            ))}
          </div>

          {/* Order summary skeleton */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm animate-pulse space-y-4">
            <div className="h-5 w-32 bg-slate-200 rounded mb-4" />
            <div className="space-y-3 pb-4 border-b border-slate-100">
              <div className="flex justify-between">
                <div className="h-3 w-20 bg-slate-100 rounded" />
                <div className="h-3 w-16 bg-slate-100 rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-24 bg-slate-100 rounded" />
                <div className="h-3 w-14 bg-slate-100 rounded" />
              </div>
            </div>
            <div className="flex justify-between pt-2">
              <div className="h-5 w-16 bg-slate-200 rounded" />
              <div className="h-5 w-24 bg-slate-200 rounded" />
            </div>
            <div className="h-12 bg-slate-200 rounded-xl w-full mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
