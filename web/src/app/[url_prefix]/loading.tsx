import { PostCardSkeleton } from '@/components/blog/PostCardSkeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Blog Header Skeleton */}
      <div className="border-b-2 border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="container-wide px-6 py-12">
          <div className="flex items-center gap-6">
            {/* Avatar Skeleton */}
            <div className="h-20 w-20 animate-pulse rounded-2xl bg-neutral-200 dark:bg-neutral-700" />
            <div className="flex-1 space-y-3">
              {/* Title Skeleton */}
              <div className="h-10 w-64 animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-700" />
              {/* Description Skeleton */}
              <div className="h-5 w-96 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Blog Controls Skeleton */}
      <div className="sticky top-0 z-20 border-b-2 border-neutral-200/80 bg-white/95 backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-950/95">
        <div className="container-wide px-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input Skeleton */}
            <div className="h-10 w-full max-w-md animate-pulse rounded-xl border-2 border-neutral-300 bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-800" />
            {/* Sort Buttons Skeleton */}
            <div className="flex h-10 w-48 animate-pulse rounded-xl border-2 border-neutral-300 bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-800" />
          </div>
        </div>
      </div>

      {/* Post Grid Skeleton */}
      <main className="container-wide px-6 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <PostCardSkeleton />
          <PostCardSkeleton />
          <PostCardSkeleton />
          <PostCardSkeleton />
          <PostCardSkeleton />
          <PostCardSkeleton />
        </div>
      </main>
    </div>
  );
}
