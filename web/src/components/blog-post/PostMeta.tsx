import { formatDate, formatReadingTime, formatViewCount } from '@/lib/blog-utils';
import type { PostMetaProps } from '@/types/blog-post';

export function PostMeta({ post, urlPrefix }: PostMetaProps) {
  const { title, published_at, reading_time_minutes, view_count, target_keyword, journals } = post;

  return (
    <div className="mb-8">
      {/* Title */}
      <h1 className="mb-4 text-4xl font-bold text-neutral-900 dark:text-white sm:text-5xl">
        {title}
      </h1>

      {/* Meta info */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
        {/* Date */}
        <div className="flex items-center gap-1">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
          </svg>
          <span>{formatDate(published_at)}</span>
        </div>

        {/* Reading time */}
        <div className="flex items-center gap-1">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
          </svg>
          <span>{formatReadingTime(reading_time_minutes)}</span>
        </div>

        {/* Views */}
        <div className="flex items-center gap-1">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
          </svg>
          <span>{formatViewCount(view_count)} views</span>
        </div>

        {/* Tags */}
        {target_keyword && (
          <>
            <span className="text-neutral-300 dark:text-neutral-700">•</span>
            <span className="font-medium text-accent">{target_keyword}</span>
          </>
        )}
      </div>

      {/* Author info */}
      {journals?.user_profiles && (
        <div className="mt-4 flex items-center gap-3">
          {journals.user_profiles.avatar_url ? (
            <img
              src={journals.user_profiles.avatar_url}
              alt={journals.user_profiles.full_name || 'Author'}
              className="h-10 w-10 rounded-full"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white">
              {journals.user_profiles.full_name?.[0] || '?'}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-neutral-900 dark:text-white">
              {journals.user_profiles.full_name || journals.display_name}
            </p>
            {journals.user_profiles.bio && (
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                {journals.user_profiles.bio}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
