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
    <article className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
      {/* Featured Media - Audio Player or Placeholder */}
      <Link href={postUrl} className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
        {audio_file_url ? (
          <div className="flex h-full w-full items-center justify-center text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              {audio_duration_seconds && (
                <span className="text-sm font-medium">
                  {Math.floor(audio_duration_seconds / 60)}:{(audio_duration_seconds % 60).toString().padStart(2, '0')}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg className="h-16 w-16 text-white/30" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
            </svg>
          </div>
        )}
      </Link>

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Tags and Reading Time */}
        <div className="mb-2 flex items-center gap-2 text-xs">
          {target_keyword && (
            <span className="rounded-full bg-blue-100 px-2 py-1 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              {target_keyword.toUpperCase()}
            </span>
          )}
          <span className="flex items-center gap-1 text-gray-500">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
            </svg>
            {formatReadingTime(reading_time_minutes)}
          </span>
        </div>

        {/* Title */}
        <Link href={postUrl}>
          <h3 className="mb-2 text-lg font-semibold leading-tight text-gray-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
            {title}
          </h3>
        </Link>

        {/* Excerpt */}
        <p className="mb-4 flex-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
          {excerpt}
        </p>

        {/* Divider */}
        <hr className="my-3 border-gray-200 dark:border-gray-800" />

        {/* Metadata Row */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
          <div className="flex items-center gap-3">
            {/* View Count */}
            <span className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
              </svg>
              {formatViewCount(view_count)}
            </span>

            {/* Publish Date */}
            <span className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
              </svg>
              {formatDate(published_at)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <button
              className="rounded p-1 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Share post"
              title="Share"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
