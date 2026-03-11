export default function Loading() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header Skeleton */}
      <header className="border-b-2 border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="container-wide py-8">
          {/* Breadcrumb skeleton */}
          <div className="mb-6 h-5 w-32 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />

          {/* Title skeleton */}
          <div className="mb-4 h-12 w-full max-w-4xl animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-700 sm:h-16" />

          {/* Meta info skeleton */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-4 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-1 w-1 animate-pulse rounded-full bg-neutral-300 dark:bg-neutral-600" />
            <div className="h-4 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-1 w-1 animate-pulse rounded-full bg-neutral-300 dark:bg-neutral-600" />
            <div className="h-4 w-28 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
          </div>
        </div>
      </header>

      {/* Content Skeleton */}
      <article className="container-wide py-12">
        <div className="container-narrow">
          {/* Audio player skeleton */}
          <div className="mb-8 flex h-20 w-full items-center justify-center animate-pulse rounded-2xl bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-600" />

          {/* Content paragraphs skeleton */}
          <div className="space-y-4">
            <div className="h-5 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-5 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-5 w-5/6 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-5 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-5 w-4/5 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-5 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-5 w-11/12 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
          </div>
        </div>
      </article>
    </div>
  );
}
