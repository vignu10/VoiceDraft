import { Sparkles } from 'lucide-react';

export default function BlogPostLoading() {
  return (
    <div className="min-h-screen">
      {/* Loading header */}
      <div className="h-16 border-b border-neutral-200/50 dark:border-neutral-800/50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm animate-pulse" />

      {/* Hero section skeleton */}
      <div className="relative overflow-hidden border-b border-neutral-200/50 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-900/50">
        <div className="container-wide py-12">
          {/* Title skeleton */}
          <div className="h-8 w-3/4 max-w-2xl bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse mb-4" />
          <div className="h-4 w-1/2 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse mb-6" />

          {/* Author info skeleton */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-neutral-200 dark:bg-neutral-800 rounded-full animate-pulse" />
            <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <main className="container-wide relative py-8">
        {/* Breadcrumb skeleton */}
        <div className="mb-8 h-4 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />

        <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
          {/* Article content skeleton */}
          <article className="space-y-4">
            <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            <div className="h-4 w-4/5 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            <div className="h-32 w-full bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse my-6" />
            <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
          </article>

          {/* Sidebar skeleton */}
          <aside className="hidden lg:block space-y-3">
            <div className="h-6 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse mb-4" />
            <div className="h-3 w-full bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            <div className="h-3 w-4/5 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            <div className="h-3 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            <div className="h-3 w-5/6 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
          </aside>
        </div>

        {/* Mobile TOC skeleton */}
        <div className="lg:hidden mt-12 space-y-3">
          <div className="h-6 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse mb-4" />
          <div className="h-3 w-full bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
          <div className="h-3 w-4/5 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
          <div className="h-3 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
        </div>
      </main>

      {/* Loading indicator at bottom */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full px-4 py-2 shadow-lg flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 z-50">
        <Sparkles className="w-4 h-4 animate-pulse" />
        <span>Loading...</span>
      </div>
    </div>
  );
}
