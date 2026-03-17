'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';

export function HeroSection() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <section className="relative bg-gradient-to-br from-neutral-50 via-white to-primary-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-primary-950/50 overflow-hidden border-b-2 border-neutral-200 dark:border-neutral-800">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large gradient orb - top right */}
        <div className="absolute -right-20 -top-20 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-neutral-300/10 to-neutral-200/10 blur-3xl dark:from-neutral-700/10 dark:to-neutral-800/10" />
        {/* Medium gradient orb - bottom left */}
        <div className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-neutral-200/10 to-neutral-300/10 blur-3xl dark:from-neutral-800/10 dark:to-neutral-700/10" />
        {/* Geometric accent lines */}
        <div className="absolute right-0 top-1/4 h-px w-32 bg-gradient-to-l from-neutral-400/30 to-transparent dark:from-neutral-600/30" />
        <div className="absolute right-16 top-1/4 h-px w-16 bg-gradient-to-l from-neutral-300/20 to-transparent dark:from-neutral-700/20" />
        <div className="absolute left-0 bottom-1/3 h-px w-24 bg-gradient-to-r from-neutral-400/20 to-transparent dark:from-neutral-600/20" />
      </div>

      <div className="container-wide">
        <div className="relative flex flex-col justify-center py-12 sm:py-16 lg:py-20">
          {/* Content - Centered text without logo */}
          <div className="mx-auto max-w-4xl text-center">
                {/* Main headline */}
                <h1 className="animate-fade-in-up animate-delay-200 text-balance font-bold tracking-tight text-neutral-900 dark:text-white text-3xl sm:text-4xl lg:text-5xl">
                  Your voice,
                  <br />
                  <span className="text-neutral-600 dark:text-neutral-400">amplified.</span>
                </h1>

                {/* Subheadline */}
                <p className="animate-fade-in-up animate-delay-300 mt-6 text-base font-medium leading-relaxed text-neutral-700 dark:text-neutral-300 sm:text-lg">
                  {isAuthenticated ? (
                    <>
                      Welcome back, {user?.full_name || user?.email?.split('@')[0] || 'Creator'}!
                      <br />
                      Ready to transform your voice into your next post?
                    </>
                  ) : (
                    <>
                      Transform spoken ideas into polished blog posts.
                      <br />
                      Join a community of creators who speak their mind.
                    </>
                  )}
                </p>

                {/* CTA Buttons */}
                <div className="animate-fade-in-up animate-delay-400 mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                  {isAuthenticated ? (
                    <>
                      <Link
                        href="/record"
                        className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-8 py-4 min-h-[52px] text-base font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl hover:shadow-primary-500/40 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary-500/50 focus:ring-offset-2"
                      >
                        Start Recording
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3H4a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        </svg>
                      </Link>
                      <Link
                        href="/drafts"
                        className="group inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-6 py-3.5 min-h-[48px] text-base font-medium text-neutral-700 shadow-sm transition-all hover:border-neutral-400 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:text-neutral-200"
                      >
                        My Drafts
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/auth/signin"
                        className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-8 py-4 min-h-[52px] text-base font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl hover:shadow-primary-500/40 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary-500/50 focus:ring-offset-2"
                      >
                        Start Creating
                        <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </Link>
                      <Link
                        href="/discover"
                        className="group inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-6 py-3.5 min-h-[48px] text-base font-medium text-neutral-700 shadow-sm transition-all hover:border-neutral-400 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:text-neutral-200"
                      >
                        Explore Content
                      </Link>
                    </>
                  )}
                </div>
          </div>
        </div>
      </div>

      {/* Bottom decorative wave */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-400/30 to-transparent dark:via-neutral-600/30" />
    </section>
  );
}
