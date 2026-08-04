export default function OrdersLoading() {
  return (
    <div className="max-w-6xl mx-auto animate-pulse p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="h-7 w-48 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-64 bg-gray-100 rounded" />
        </div>
        <div className="h-10 w-64 bg-gray-200 rounded-lg" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex gap-4">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-4 w-40 bg-gray-200 rounded" />
          <div className="h-4 w-28 bg-gray-200 rounded" />
        </div>
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-5 w-36 bg-gray-200 rounded" />
              <div className="h-3 w-24 bg-gray-100 rounded" />
            </div>
            <div className="h-4 w-48 bg-gray-100 rounded" />
            <div className="h-6 w-20 bg-amber-50 rounded-full" />
            <div className="h-8 w-24 bg-gray-200 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
