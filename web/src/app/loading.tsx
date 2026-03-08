export default function Loading() {
  return (
    <main className="min-h-screen">
      {/* Hero skeleton - removed gradient, using solid brand color */}
      <section className="relative bg-neutral-50 dark:bg-neutral-950">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="animate-pulse text-center">
            <div className="mx-auto h-12 w-3/4 rounded bg-neutral-300 dark:bg-neutral-700 sm:h-16" />
            <div className="mx-auto mt-6 h-6 w-1/2 rounded bg-neutral-300 dark:bg-neutral-700" />
          </div>
        </div>
      </section>

      {/* Search skeleton */}
      <div className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="h-10 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />
        </div>
      </div>

      {/* Blogs grid skeleton */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                  <div className="flex-1">
                    <div className="h-5 w-3/4 rounded bg-neutral-300 dark:bg-neutral-700" />
                    <div className="mt-2 h-4 w-1/3 rounded bg-neutral-300 dark:bg-neutral-700" />
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
