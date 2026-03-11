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
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border-2 border-neutral-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
      {/* Gradient accent on hover - hidden by default, shows on group hover */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Featured Media - Bold and distinctive */}
      {audio_file_url && (
        <Link href={postUrl} className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900">
          <div className="relative flex h-full w-full items-center justify-center">
            {/* Audio player visual - Bold, centered design */}
            <div className="relative flex flex-col items-center gap-4 transition-transform duration-300 group-hover:scale-105">
              {/* Play button */}
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg">
                <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>

              {/* Audio duration */}
              {audio_duration_seconds && (
                <div className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-neutral-800 shadow-md backdrop-blur-sm dark:bg-neutral-800/90 dark:text-neutral-200 min-h-[44px]">
                  <svg className="h-4 w-4 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                  </svg>
                  <span>{Math.floor(audio_duration_seconds / 60)}:{(audio_duration_seconds % 60).toString().padStart(2, '0')}</span>
                </div>
              )}

              {/* Audio waveform decoration */}
              <div className="flex items-end gap-1 h-8 opacity-30">
                {[40, 60, 80, 50, 70, 90, 55, 65].map((height, i) => (
                  <div
                    key={i}
                    className="w-1 bg-primary-500 rounded-full animate-pulse"
                    style={{
                      height: `${height}%`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Content - Generous spacing and bold typography */}
      <div className="flex flex-1 flex-col p-6">
        {/* Meta - Distinctive pill styling with proper touch targets */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {/* Reading time pill - increased padding for 44px minimum */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-4 py-2 text-xs font-bold text-primary-600 dark:bg-primary-950/50 dark:text-primary-400 min-h-[44px]">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
            </svg>
            {formatReadingTime(reading_time_minutes)}
          </span>

          {/* Topic tag - if exists - increased padding */}
          {target_keyword && (
            <>
              <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
              <span className="inline-flex items-center rounded-full bg-accent-50 px-4 py-2 text-xs font-bold text-accent-600 dark:bg-accent-950/50 dark:text-accent-400 min-h-[44px]">
                {target_keyword}
              </span>
            </>
          )}
        </div>

        {/* Title - Bold and prominent with visible colors */}
        <Link href={postUrl}>
          <h3 className="mb-3 text-xl font-bold leading-snug text-neutral-900 dark:text-white sm:text-2xl">
            {title}
          </h3>
        </Link>

        {/* Excerpt - Clear and readable */}
        <p className="mb-5 flex-1 text-base leading-relaxed text-neutral-600 dark:text-neutral-400 line-clamp-3">
          {excerpt}
        </p>

        {/* Footer - Bold, distinct styling */}
        <div className="flex items-center justify-between border-t border-neutral-200 pt-4 text-sm dark:border-neutral-800">
          <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-500">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" />
            </svg>
            <span className="font-medium">{formatDate(published_at)}</span>
          </div>
          <div className="flex items-center gap-2 font-semibold text-neutral-600 dark:text-neutral-400">
            <svg className="h-4 w-4 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
            </svg>
            <span>{formatViewCount(view_count)} views</span>
          </div>
        </div>
      </div>
    </article>
  );
}
