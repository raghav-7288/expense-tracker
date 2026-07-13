export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Summary cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3 bg-gray-200 rounded w-16" />
              <div className="h-7 w-7 bg-gray-200 rounded-lg" />
            </div>
            <div className="h-5 bg-gray-200 rounded w-24" />
            <div className="h-3 bg-gray-200 rounded w-12" />
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white shadow-sm p-5">
          <div className="h-4 bg-gray-200 rounded w-32 mb-4" />
          <div className="h-72 bg-gray-100 rounded-lg" />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
          <div className="h-4 bg-gray-200 rounded w-28 mb-4" />
          <div className="h-72 bg-gray-100 rounded-lg" />
        </div>
      </div>

      {/* More skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
            <div className="h-4 bg-gray-200 rounded w-28 mb-4" />
            <div className="h-56 bg-gray-100 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

