'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';

export function HeroSection() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <section className="relative hero-gradient overflow-hidden border-b-2 border-neutral-200 dark:border-neutral-800">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large gradient orb - top right */}
        <div className="absolute -right-20 -top-20 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-primary-500/10 to-accent-500/10 blur-3xl" />
        {/* Medium gradient orb - bottom left */}
        <div className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-accent-500/10 to-primary-500/10 blur-3xl" />
        {/* Geometric accent lines */}
        <div className="absolute right-0 top-1/4 h-px w-32 bg-gradient-to-l from-primary-500/30 to-transparent" />
        <div className="absolute right-16 top-1/4 h-px w-16 bg-gradient-to-l from-accent-500/20 to-transparent" />
        <div className="absolute left-0 bottom-1/3 h-px w-24 bg-gradient-to-r from-primary-500/20 to-transparent" />
      </div>

      <div className="container-wide">
        <div className="relative flex min-h-[70vh] flex-col justify-center py-24 sm:py-32 lg:py-40">
          {/* Content - Asymmetric layout with dramatic typography */}
          <div className="mx-auto max-w-4xl">
            {/* Badge */}
            <div className="animate-fade-in-up mb-8 inline-flex items-center gap-2 rounded-full border-2 border-primary-500/20 bg-primary-50/50 px-4 py-2 text-sm font-semibold text-primary-600 dark:border-primary-500/30 dark:bg-primary-950/50 dark:text-primary-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-500 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-500"></span>
              </span>
              Now with AI-powered transcription
            </div>

            {/* Main headline - Extreme scale with bold accent color */}
            <h1 className="animate-fade-in-up animate-delay-100 text-balance font-bold tracking-tight text-neutral-900 dark:text-white text-hero">
              Your voice,
              <br />
              <span className="text-primary-600 dark:text-primary-400">amplified.</span>
            </h1>

            {/* Subheadline - Bold and direct */}
            <p className="animate-fade-in-up animate-delay-200 mt-8 text-xl font-medium leading-relaxed text-neutral-700 dark:text-neutral-300 sm:text-2xl lg:text-3xl">
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
                    className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-10 py-4 text-base font-bold text-white shadow-xl shadow-primary-500/30 transition-all hover:shadow-2xl hover:shadow-primary-500/40 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary-500/50 focus:ring-offset-2"
                  >
                    Start Recording
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3H4a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    </svg>
                  </Link>
                  <Link
                    href="/drafts"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl border-2 border-neutral-300 bg-white px-10 py-4 text-base font-bold text-neutral-700 shadow-md transition-all hover:border-primary-500 hover:text-primary-600 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-primary-500 dark:hover:text-primary-400"
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
                    href="/api/auth/signin"
                    className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-10 py-4 text-base font-bold text-white shadow-xl shadow-primary-500/30 transition-all hover:shadow-2xl hover:shadow-primary-500/40 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary-500/50 focus:ring-offset-2"
                  >
                    Start Creating
                    <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <Link
                    href="/#featured-blogs"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl border-2 border-neutral-300 bg-white px-10 py-4 text-base font-bold text-neutral-700 shadow-md transition-all hover:border-primary-500 hover:text-primary-600 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-primary-500 dark:hover:text-primary-400"
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
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />
    </section>
  );
}
