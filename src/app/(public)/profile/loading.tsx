export default function ProfileLoading() {
  return (
    <div className="flex-1 bg-surface min-h-screen pt-28 sm:pt-32 pb-16 sm:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header Breadcrumb / Title Skeleton */}
        <div className="mb-8">
          <div className="h-4 w-28 bg-slate-200 rounded animate-pulse mb-3" />
          <div className="h-9 w-56 bg-slate-200 rounded-lg animate-pulse" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar Skeleton */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm animate-pulse">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-100 mb-6">
              <div className="w-16 h-16 rounded-full bg-slate-200" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 bg-slate-200 rounded" />
                <div className="h-3 w-44 bg-slate-100 rounded" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-10 bg-slate-100 rounded-xl" />
              <div className="h-10 bg-slate-100 rounded-xl" />
              <div className="h-10 bg-slate-100 rounded-xl" />
            </div>
          </div>

          {/* Main Content Skeleton */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-sm animate-pulse space-y-6">
            <div className="h-6 w-40 bg-slate-200 rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="h-12 bg-slate-100 rounded-xl" />
              <div className="h-12 bg-slate-100 rounded-xl" />
            </div>
            <div className="h-12 bg-slate-100 rounded-xl" />
            <div className="h-12 bg-slate-100 rounded-xl" />
            <div className="h-11 w-36 bg-slate-200 rounded-xl mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
