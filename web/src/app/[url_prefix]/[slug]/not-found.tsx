import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-neutral-900">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 -translate-y-1/2 -translate-x-1/2">
          <div className="h-64 w-64 rounded-full bg-gradient-to-br from-accent/10 to-transparent blur-3xl" />
        </div>
        <div className="absolute bottom-1/4 right-1/4 translate-y-1/2 translate-x-1/2">
          <div className="h-96 w-96 rounded-full bg-gradient-to-tl from-accent/5 to-transparent blur-3xl" />
        </div>
      </div>

      <div className="relative text-center">
        <div className="mb-6 inline-flex">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-accent to-accent-light blur-xl opacity-50 animate-pulse" />
            <div className="relative rounded-full bg-gradient-to-br from-accent to-accent-dark px-8 py-6">
              <span className="text-4xl font-bold text-white">404</span>
            </div>
          </div>
        </div>

        <h1 className="mb-3 text-xl font-bold text-neutral-900 dark:text-white sm:text-2xl">
          Post not found
        </h1>
        <p className="mb-2 max-w-md mx-auto text-base text-neutral-600 dark:text-neutral-400 sm:text-lg">
          This post doesn't exist or isn't published yet.
        </p>
        <p className="mb-8 text-sm text-neutral-500 dark:text-neutral-500">
          The link may be broken or the post has been removed.
        </p>

        <Link
          href="/"
          className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-accent to-accent-hover px-8 py-3.5 font-medium text-white transition-all hover:shadow-lg hover:shadow-accent/25 hover:scale-105 active:scale-95"
        >
          <span className="relative z-10">Go back home</span>
          <svg className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
