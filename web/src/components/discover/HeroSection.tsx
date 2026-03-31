'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';

export function HeroSection() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <section className="relative bg-white dark:bg-neutral-950 overflow-hidden border-b-2 border-neutral-200 dark:border-neutral-800">
      {/* Minimal geometric accent - top right */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute right-0 top-0 h-1 w-32 bg-primary-500/20" />
        <div className="absolute right-12 top-0 h-1 w-16 bg-primary-500/10" />
      </div>

      <div className="container-wide">
        <div className="relative flex min-h-[calc(100vh-60px)] flex-col justify-center py-12 sm:py-16 lg:py-20">
          {/* Content - Left aligned, asymmetric layout */}
          <div className="max-w-3xl">
                {/* Main headline - dramatic scale, distinctive */}
                <h1 className="animate-fade-in-up animate-delay-200 font-display font-bold tracking-tight text-neutral-900 dark:text-white text-5xl sm:text-6xl lg:text-7xl leading-[1.1]">
                  Your voice,
                  <br />
                  <span className="text-primary-600 dark:text-primary-400">amplified.</span>
                </h1>

                {/* Subheadline - editorial style */}
                <p className="animate-fade-in-up animate-delay-300 mt-8 text-lg font-medium leading-relaxed text-neutral-700 dark:text-neutral-300 max-w-2xl">
                  {isAuthenticated ? (
                    <>
                      Welcome back, {user?.full_name || user?.email?.split('@')[0] || 'Creator'}. Ready to transform your voice into your next post?
                    </>
                  ) : (
                    <>
                      Transform spoken ideas into polished blog posts. Join a community of creators who speak their mind.
                    </>
                  )}
                </p>

                {/* CTA Buttons */}
                <div className="animate-fade-in-up animate-delay-400 mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                  {isAuthenticated ? (
                    <>
                      <Link
                        href="/record"
                        className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-8 py-4 min-h-[48px] text-base font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl hover:shadow-primary-500/40 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary-500/50 focus:ring-offset-2"
                      >
                        Start Recording
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3H4a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        </svg>
                      </Link>
                      <Link
                        href="/drafts"
                        className="group inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white min-h-[48px] px-6 py-3.5 text-base font-medium text-neutral-700 shadow-sm transition-all hover:border-neutral-400 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:text-neutral-200"
                      >
                        My Drafts
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/auth/signin"
                        className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-8 py-4 min-h-[48px] text-base font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl hover:shadow-primary-500/40 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary-500/50 focus:ring-offset-2"
                      >
                        Start Creating
                        <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </Link>
                      <Link
                        href="/discover"
                        className="group inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white min-h-[48px] px-6 py-3.5 text-base font-medium text-neutral-700 shadow-sm transition-all hover:border-neutral-400 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:text-neutral-200"
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
