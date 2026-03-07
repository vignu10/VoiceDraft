export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header Skeleton */}
      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="h-16 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800 sm:h-20 sm:w-20" />
            <div className="flex-1 space-y-2">
              <div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-4 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            </div>
          </div>
        </div>
      </div>

      {/* Controls Skeleton */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex gap-4">
            <div className="h-10 flex-1 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
            <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
          </div>
        </div>
      </div>

      {/* Cards Skeleton */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-video rounded-t-xl bg-gray-200 dark:bg-gray-800" />
              <div className="rounded-b-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <div className="mb-2 h-4 w-20 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="mb-4 h-6 w-full rounded bg-gray-200 dark:bg-gray-800" />
                <div className="mb-2 h-4 w-full rounded bg-gray-200 dark:bg-gray-800" />
                <div className="mb-4 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="h-px bg-gray-200 dark:bg-gray-800" />
                <div className="mt-3 flex justify-between">
                  <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-800" />
                  <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-800" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
