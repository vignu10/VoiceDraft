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
      className="group flex flex-col overflow-hidden border border-stone-200 bg-white transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-stone-800 dark:bg-stone-900"
    >
      <div className="p-6">
        {/* Author Header */}
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="relative h-14 w-14 overflow-hidden rounded-full bg-gradient-to-br from-amber-500 to-orange-600">
              {user_profiles?.avatar_url ? (
                <Image
                  src={user_profiles.avatar_url}
                  alt={authorName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-bold text-white">
                  {getInitials(authorName)}
                </div>
              )}
            </div>
          </div>

          {/* Author Info */}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold text-stone-900 group-hover:text-amber-700 dark:text-stone-100 dark:group-hover:text-amber-400">
              {display_name}
            </h3>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {formatPostCount(post_count)}
            </p>
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="mt-4 line-clamp-2 text-sm text-stone-600 dark:text-stone-400">
            {truncate(description, 100)}
          </p>
        )}

        {/* Latest Post */}
        {latest_post && (
          <div className="mt-4 rounded bg-stone-100 p-3 dark:bg-stone-800">
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
              Latest post
            </p>
            <p className="mt-1 truncate text-sm font-medium text-stone-900 dark:text-stone-100">
              {latest_post.title}
            </p>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-500">
              {formatDate(latest_post.published_at)}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
