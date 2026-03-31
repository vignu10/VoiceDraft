'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { JournalWithAuthor } from '@/types/blog';

interface BlogHeaderProps {
  journal: JournalWithAuthor;
}

export function BlogHeader({ journal }: BlogHeaderProps) {
  const { display_name, description, user_profiles } = journal;

  return (
    <header className="relative border-b-2 border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
      {/* Decorative gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute right-0 top-0 h-64 w-1/2 bg-gradient-to-l from-primary-500/5 to-transparent" />
        <div className="absolute left-0 bottom-0 h-48 w-1/3 bg-gradient-to-r from-accent-500/5 to-transparent" />
      </div>

      <div className="container-wide">
        <div className="relative flex flex-col gap-8 py-12 lg:py-16">
          {/* Main header area */}
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left lg:gap-8">
            {/* Author Avatar - Bold, larger design */}
            <Link
              href={`/${journal.url_prefix}`}
              className="flex-shrink-0 group"
            >
              <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-200 shadow-xl ring-4 ring-white transition-transform duration-300 group-hover:scale-105 group-hover:shadow-2xl dark:from-neutral-800 dark:to-neutral-900 dark:ring-neutral-900 sm:h-24 sm:w-24">
                {user_profiles.avatar_url ? (
                  <Image
                    src={user_profiles.avatar_url}
                    alt=""
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-500 to-primary-600 text-white text-3xl font-bold">
                    {display_name.charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Online indicator */}
                <div className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white bg-success-500 dark:border-neutral-900" />
              </div>
            </Link>

            {/* Journal Info - Bold typography */}
            <div className="flex-1">
              <div className="text-balance text-xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-2xl lg:text-3xl">
                {display_name}
              </div>

              {description && (
                <p className="mt-4 text-base leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-lg">
                  {description}
                </p>
              )}

              {user_profiles.bio && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-neutral-500 sm:justify-start lg:text-base">
                  <svg className="h-4 w-4 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                  <span>By {user_profiles.full_name || 'Anonymous'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Decorative line - adds visual interest */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />

          {/* Stats row - Optional enhancement */}
          <div className="flex items-center justify-center gap-8 text-center sm:justify-start">
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">
              <svg className="h-5 w-5 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
              </svg>
              <span>Blog</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
