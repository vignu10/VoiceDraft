import { BlogCardSkeleton } from '@/components/discover/BlogCardSkeleton';
import { PostCardSkeleton } from '@/components/blog/PostCardSkeleton';

export default function Loading() {
  return (
    <main className="min-h-screen">
      {/* Hero skeleton */}
      <section className="relative bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-950">
        <div className="container-wide py-24 sm:py-32">
          <div className="animate-pulse text-center">
            {/* Main headline skeleton */}
            <div className="mx-auto h-16 w-full max-w-3xl rounded-2xl bg-neutral-200 dark:bg-neutral-700" />
            {/* Subheadline skeleton */}
            <div className="mx-auto mt-6 h-6 w-full max-w-xl rounded-xl bg-neutral-200 dark:bg-neutral-700" />
          </div>
        </div>
      </section>

      {/* Search skeleton */}
      <div className="sticky top-0 z-10 border-b-2 border-neutral-200/80 bg-white/95 backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-950/95">
        <div className="container-wide py-5">
          <div className="h-10 w-full max-w-md animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-700" />
        </div>
      </div>

      {/* Featured Blogs grid skeleton */}
      <section className="py-16">
        <div className="container-wide">
          <div className="mb-10 flex items-center gap-4">
            <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-accent-500/50 to-transparent" />
            <div className="h-8 w-40 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-accent-500/50 to-transparent" />
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            <BlogCardSkeleton />
            <BlogCardSkeleton />
            <BlogCardSkeleton />
          </div>
        </div>
      </section>

      {/* Recent Posts grid skeleton */}
      <section className="border-t-2 border-neutral-200 bg-gradient-to-b from-neutral-50 to-white py-16 dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-950">
        <div className="container-wide">
          <div className="mb-10 flex items-center gap-4">
            <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />
            <div className="h-8 w-56 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        </div>
      </section>
    </main>
  );
}
