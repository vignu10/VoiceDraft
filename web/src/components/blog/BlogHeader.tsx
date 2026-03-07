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
    <header className="border-b border-gray-200 bg-white py-8 dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
          {/* Author Avatar */}
          <Link
            href={`/${journal.url_prefix}`}
            className="flex-shrink-0"
          >
            <div className="relative h-16 w-16 overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-purple-600 sm:h-20 sm:w-20">
              {user_profiles.avatar_url ? (
                <Image
                  src={user_profiles.avatar_url}
                  alt={user_profiles.full_name || display_name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
                  {display_name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </Link>

          {/* Journal Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              {display_name}
            </h1>

            {description && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 sm:text-base">
                {description}
              </p>
            )}

            {user_profiles.bio && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-500 sm:text-sm">
                By {user_profiles.full_name || 'Anonymous'}
              </p>
            )}
          </div>

          {/* Action Buttons - Placeholder for future features */}
          <div className="flex gap-2 sm:mt-0">
            <button
              className="rounded-full bg-gray-100 p-2 text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              aria-label="Share journal"
              title="Share (coming soon)"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
