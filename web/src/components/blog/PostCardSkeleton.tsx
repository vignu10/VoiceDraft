export function PostCardSkeleton() {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border-2 border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      {/* Gradient accent */}
      <div className="h-1 bg-gradient-to-r from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-600" />

      {/* Featured media skeleton */}
      <div className="relative aspect-[16/9] w-full animate-pulse bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-200 dark:bg-neutral-700" />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-6">
        {/* Meta pills skeleton */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="h-9 w-20 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-1 w-1 animate-pulse rounded-full bg-neutral-300 dark:bg-neutral-600" />
          <div className="h-9 w-16 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
        </div>

        {/* Title skeleton */}
        <div className="mb-3 space-y-2">
          <div className="h-6 w-3/4 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-6 w-1/2 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
        </div>

        {/* Excerpt skeleton */}
        <div className="mb-5 space-y-2 flex-1">
          <div className="h-4 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-4 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        </div>

        {/* Footer skeleton */}
        <div className="flex items-center justify-between border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-4 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-4 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
          </div>
        </div>
      </div>
    </div>
  );
}
