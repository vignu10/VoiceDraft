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
      className="group flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white transition-all hover:shadow-lg hover:-translate-y-0.5 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="relative h-12 w-12 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
              {user_profiles?.avatar_url ? (
                <Image
                  src={user_profiles.avatar_url}
                  alt={authorName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-neutral-600 dark:text-neutral-400">
                  {getInitials(authorName)}
                </div>
              )}
            </div>
          </div>

          {/* Author Info */}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold text-neutral-900 transition-colors group-hover:text-accent dark:text-white">
              {display_name}
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {formatPostCount(post_count)}
            </p>
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="mt-4 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
            {truncate(description, 100)}
          </p>
        )}

        {/* Latest Post */}
        {latest_post && (
          <div className="mt-4 rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800/50">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Latest
            </p>
            <p className="mt-1 truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {latest_post.title}
            </p>
            <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
              {formatDate(latest_post.published_at)}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
