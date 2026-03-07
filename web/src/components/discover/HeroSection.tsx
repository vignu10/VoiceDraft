'use client';

import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="relative bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
      <div className="container-wide">
        <div className="flex min-h-[60vh] flex-col justify-center py-20 sm:py-24 lg:py-32">
          {/* Content */}
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Your voice,{' '}
              <span className="text-accent">amplified.</span>
            </h1>
            <p className="mt-6 text-lg text-neutral-600 dark:text-neutral-400 sm:text-xl">
              Transform your spoken words into polished blog posts. Join a community of creators who speak their mind.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/api/auth/signin"
                className="inline-flex items-center justify-center rounded-lg bg-accent px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-950"
              >
                Start Writing
              </Link>
              <Link
                href="#featured-blogs"
                className="inline-flex items-center justify-center rounded-lg px-8 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 focus:ring-offset-white dark:text-neutral-300 dark:hover:bg-neutral-800 dark:focus:ring-neutral-500 dark:focus:ring-offset-neutral-950"
              >
                Explore Content
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
