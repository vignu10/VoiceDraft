export default function Loading() {
  return (
    <main className="min-h-screen">
      {/* Hero skeleton */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-950">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="animate-pulse text-center">
            <div className="mx-auto h-12 w-3/4 rounded bg-gray-300 dark:bg-gray-700 sm:h-16" />
            <div className="mx-auto mt-6 h-6 w-1/2 rounded bg-gray-300 dark:bg-gray-700" />
          </div>
        </div>
      </section>

      {/* Search skeleton */}
      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="h-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>

      {/* Blogs grid skeleton */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-gray-300 dark:bg-gray-700" />
                  <div className="flex-1">
                    <div className="h-5 w-3/4 rounded bg-gray-300 dark:bg-gray-700" />
                    <div className="mt-2 h-4 w-1/3 rounded bg-gray-300 dark:bg-gray-700" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
