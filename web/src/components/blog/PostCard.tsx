'use client';

import Link from 'next/link';
import { formatViewCount, formatDate, formatReadingTime } from '@/lib/blog-utils';
import type { PostCardData } from '@/types/blog';

interface PostCardProps {
  post: PostCardData;
  urlPrefix: string;
}

export function PostCard({ post, urlPrefix }: PostCardProps) {
  const {
    title,
    slug,
    excerpt,
    target_keyword,
    published_at,
    reading_time_minutes,
    view_count,
    audio_file_url,
    audio_duration_seconds,
  } = post;

  const postUrl = `/${urlPrefix}/${slug}`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white transition-shadow duration-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
      {/* Featured Media */}
      <Link href={postUrl} className="relative aspect-video w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        {audio_file_url ? (
          <div className="flex h-full w-full items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              {audio_duration_seconds && (
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {Math.floor(audio_duration_seconds / 60)}:{(audio_duration_seconds % 60).toString().padStart(2, '0')}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-400">
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        {/* Meta */}
        <div className="mb-3 flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
            </svg>
            {formatReadingTime(reading_time_minutes)}
          </span>
          {target_keyword && (
            <>
              <span className="text-neutral-300 dark:text-neutral-700">•</span>
              <span className="font-medium text-accent">{target_keyword}</span>
            </>
          )}
        </div>

        {/* Title */}
        <Link href={postUrl}>
          <h3 className="mb-2 text-xl font-semibold leading-snug text-neutral-900 transition-colors group-hover:text-accent dark:text-white">
            {title}
          </h3>
        </Link>

        {/* Excerpt */}
        <p className="mb-4 flex-1 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
          {excerpt}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-500">
          <span>{formatDate(published_at)}</span>
          <span>{formatViewCount(view_count)} views</span>
        </div>
      </div>
    </article>
  );
}
