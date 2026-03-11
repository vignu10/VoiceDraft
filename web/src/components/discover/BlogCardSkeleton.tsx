export function BlogCardSkeleton() {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border-2 border-neutral-200 bg-white transition-all dark:border-neutral-800 dark:bg-neutral-900">
      {/* Gradient accent on hover */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent-500 via-primary-500 to-accent-500 opacity-60" />

      {/* Header section with avatar */}
      <div className="flex flex-1 flex-col p-6">
        {/* Author info */}
        <div className="mb-5 flex items-center gap-3">
          {/* Avatar skeleton */}
          <div className="relative h-12 w-12 animate-pulse rounded-xl bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-600" />

          {/* Author info skeleton */}
          <div className="flex flex-col">
            <div className="mb-1 h-5 w-28 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-3.5 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
          </div>
        </div>

        {/* Title skeleton */}
        <div className="mb-3 space-y-2">
          <div className="h-6 w-full animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-6 w-2/3 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
        </div>

        {/* Description skeleton */}
        <div className="mb-5 space-y-2 flex-1">
          <div className="h-4 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-4 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        </div>

        {/* Stats pills skeleton */}
        <div className="mb-5 flex flex-wrap gap-2">
          <div className="h-8 w-16 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-8 w-14 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
        </div>

        {/* Footer with date */}
        <div className="flex items-center justify-between border-t border-neutral-200 pt-4 text-sm dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-4 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
          </div>
        </div>
      </div>
    </div>
  );
}
