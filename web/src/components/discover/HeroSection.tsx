'use client';

import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="relative bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-900">
      {/* Subtle geometric accent */}
      <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 dark:opacity-5">
        <div className="absolute top-20 right-20 w-64 h-64 border border-stone-900 dark:border-stone-100 rotate-12" />
        <div className="absolute top-32 right-32 w-48 h-48 border border-stone-900 dark:border-stone-100 -rotate-6" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div className="text-left">
            <div className="inline-block">
              <span className="text-xs font-semibold tracking-wider uppercase text-amber-700 dark:text-amber-400">
                Discover
              </span>
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-100 sm:text-5xl md:text-6xl font-serif">
              Voices worth<br />hearing.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-stone-600 dark:text-stone-400 leading-relaxed">
              Explore a community of writers and creators sharing their perspectives through voice and text.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/api/auth/signin"
                className="inline-flex items-center justify-center bg-stone-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 dark:focus:ring-offset-stone-950"
              >
                Start Your Blog
              </Link>
              <Link
                href="#featured-blogs"
                className="inline-flex items-center justify-center border-b border-stone-900 px-6 py-3 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 dark:border-stone-100 dark:text-stone-100 dark:hover:bg-stone-900 dark:focus:ring-offset-stone-950"
              >
                Explore
              </Link>
            </div>
          </div>

          {/* Right: Decorative element */}
          <div className="hidden lg:block">
            <div className="relative">
              <div className="aspect-[4/3] bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950/30 dark:to-orange-950/30">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <svg className="mx-auto h-24 w-24 text-amber-700/50 dark:text-amber-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <p className="mt-4 text-sm font-medium text-amber-900/70 dark:text-amber-100/70">
                      Your story, amplified
                    </p>
                  </div>
                </div>
              </div>
              {/* Corner accent */}
              <div className="absolute -bottom-2 -right-2 w-full h-full border-2 border-stone-900 dark:border-stone-100 -z-10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
