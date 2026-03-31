'use client';

import Link from 'next/link';
import Image from 'next/image';
import { truncate, formatPostCount, getInitials } from '@/lib/discover-utils';
import { formatDate } from '@/lib/blog-utils';
import type { BlogDiscoveryCard } from '@/types/discover';

interface BlogDiscoveryCardProps {
  blog: BlogDiscoveryCard;
}

export function BlogDiscoveryCard({ blog }: BlogDiscoveryCardProps) {
  const { url_prefix, display_name, description, post_count, latest_post, user_profiles } = blog;
  const authorName = user_profiles?.full_name || display_name;

  return (
    <Link
      href={`/${url_prefix}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border-2 border-neutral-200/50 bg-frosted transition-transform duration-300 hover:-translate-y-1 hover:border-neutral-400/50 hover:shadow-2xl hover:shadow-neutral-500/10 focus:outline-none focus:ring-4 focus:ring-primary-500/50 dark:border-neutral-800/50 dark:hover:border-neutral-600/50"
    >
      {/* Gradient accent on hover */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-neutral-800 via-neutral-600 to-neutral-800 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-neutral-200 dark:via-neutral-400 dark:to-neutral-200" />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 ring-2 ring-white shadow-lg transition-transform duration-300 group-hover:scale-110 dark:from-neutral-800 dark:to-neutral-900 dark:ring-neutral-900">
              {user_profiles?.avatar_url ? (
                <Image
                  src={user_profiles.avatar_url}
                  alt=""
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-700 to-neutral-800 text-white text-lg font-bold dark:from-neutral-300 dark:to-neutral-400 dark:text-neutral-900">
                  {getInitials(authorName)}
                </div>
              )}
            </div>
          </div>

          {/* Author Info */}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-xl font-bold text-neutral-900 transition-colors group-hover:text-neutral-600 dark:text-white sm:text-2xl">
              {display_name}
            </h3>
            <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
              {formatPostCount(post_count)}
            </p>
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="mt-4 line-clamp-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-sm">
            {truncate(description, 100)}
          </p>
        )}

        {/* Latest Post */}
        {latest_post && (
          <div className="mt-4 rounded-xl bg-gradient-to-br from-neutral-50 to-neutral-100 p-4 ring-1 ring-neutral-200 dark:from-neutral-800/50 dark:to-neutral-900/50 dark:ring-neutral-700">
            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-300">
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              <span>Latest Post</span>
            </div>
            <p className="mt-2 truncate text-base font-semibold text-neutral-900 dark:text-neutral-100 sm:text-lg">
              {latest_post.title}
            </p>
            <p className="mt-1 text-xs font-medium text-neutral-500 dark:text-neutral-500">
              {formatDate(latest_post.published_at)}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
