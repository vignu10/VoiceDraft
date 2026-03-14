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
        <div className="relative flex min-h-[70vh] flex-col justify-center py-24 sm:py-32 lg:py-40">
          {/* Content - Asymmetric layout with dramatic typography */}
          <div className="mx-auto max-w-4xl">
            {/* Badge */}
            <div className="animate-fade-in-up mb-8 inline-flex items-center gap-2 rounded-full border-2 border-neutral-400/30 bg-neutral-100/50 px-4 py-2 text-sm font-semibold text-neutral-700 dark:border-neutral-600/30 dark:bg-neutral-800/50 dark:text-neutral-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neutral-500 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-neutral-500"></span>
              </span>
              Now with AI-powered transcription
            </div>

            {/* Main headline - Extreme scale with bold accent color */}
            <h1 className="animate-fade-in-up animate-delay-100 text-balance font-bold tracking-tight text-neutral-900 dark:text-white text-4xl sm:text-5xl lg:text-6xl">
              Your voice,
              <br />
              <span className="text-neutral-600 dark:text-neutral-400">amplified.</span>
            </h1>

            {/* Subheadline - Bold and direct */}
            <p className="animate-fade-in-up animate-delay-200 mt-8 text-base font-medium leading-relaxed text-neutral-700 dark:text-neutral-300 sm:text-lg lg:text-xl">
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

            {/* CTA Buttons - Bold and action-oriented */}
            <div className="animate-fade-in-up animate-delay-300 mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:mt-14">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/record"
                    className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800 px-10 py-4 text-base font-bold text-white shadow-xl shadow-neutral-500/20 transition-all hover:shadow-2xl hover:shadow-primary-500/40 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-neutral-500/50 focus:ring-offset-2"
                  >
                    Start Recording
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3H4a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    </svg>
                  </Link>
                  <Link
                    href="/drafts"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl border-2 border-neutral-300 bg-white px-10 py-4 text-base font-bold text-neutral-700 shadow-md transition-all hover:border-neutral-500 hover:text-neutral-900 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-neutral-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-500 dark:hover:text-neutral-100"
                  >
                    My Drafts
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 011-2 2h6a2 2 0 012-2v-2a2 2 0 01-2-2H9z" />
                    </svg>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/signin"
                    className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800 px-10 py-4 text-base font-bold text-white shadow-xl shadow-neutral-500/20 transition-all hover:shadow-2xl hover:shadow-primary-500/40 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-neutral-500/50 focus:ring-offset-2"
                  >
                    Start Creating
                    <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <Link
                    href="/discover"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl border-2 border-neutral-300 bg-white px-10 py-4 text-base font-bold text-neutral-700 shadow-md transition-all hover:border-primary-500 hover:text-primary-600 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-neutral-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-primary-500 dark:hover:text-primary-400"
                  >
                    Explore Content
                    <svg className="h-5 w-5 transition-transform group-hover:translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
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
