import { formatDate, formatReadingTime, formatViewCount } from '@/lib/blog-utils';
import type { PostMetaProps } from '@/types/blog-post';
import { ShareButtons } from '@/components/blog-post/ShareButtons';

export function PostMeta({ post, urlPrefix }: PostMetaProps) {
  const { title, published_at, reading_time_minutes, view_count, target_keyword, journals } = post;

  // Construct full URL for sharing
  const shareUrl = typeof window !== 'undefined'
    ? window.location.href
    : `${process.env.NEXT_PUBLIC_APP_URL || ''}/${urlPrefix}/${post.slug}`;

  return (
    <div className="mb-8">
      {/* Title with gradient underline effect */}
      <div className="relative">
        <h1 className="mb-4 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 bg-clip-text text-xl font-bold text-transparent dark:from-white dark:via-neutral-100 dark:to-white sm:text-2xl lg:text-3xl">
          {title}
        </h1>
        <div className="absolute -bottom-2 left-0 h-1 w-32 rounded-full bg-gradient-to-r from-neutral-800 via-neutral-600 to-neutral-800 dark:from-neutral-200 dark:via-neutral-400 dark:to-neutral-200" />
      </div>

      {/* Share buttons */}
      <div className="mb-4">
        <ShareButtons title={title} url={shareUrl} />
      </div>

      {/* Meta info with delight styling */}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        {/* Date */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
          </svg>
          <span className="font-medium">{formatDate(published_at)}</span>
        </div>

        {/* Reading time */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
          </svg>
          <span className="font-medium">{formatReadingTime(reading_time_minutes)}</span>
        </div>

        {/* Views */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
          </svg>
          <span className="font-medium">{formatViewCount(view_count)} views</span>
        </div>

        {/* Tags with gradient styling */}
        {target_keyword && (
          <span className="inline-flex items-center rounded-full bg-gradient-to-r from-neutral-800/10 to-neutral-600/5 px-3 py-1 text-sm font-semibold text-neutral-700 ring-1 ring-neutral-300 dark:from-neutral-200/10 dark:to-neutral-400/5 dark:text-neutral-300 dark:ring-neutral-700">
            {target_keyword}
          </span>
        )}
      </div>

      {/* Author info with delight styling */}
      {journals?.user_profiles && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-neutral-50 to-white p-4 shadow-sm dark:from-neutral-800/50 dark:to-neutral-900/50 border border-neutral-200/30 dark:border-neutral-700/30">
          {journals.user_profiles.avatar_url ? (
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-neutral-300 to-neutral-100 blur-sm dark:from-neutral-700 dark:to-neutral-500" />
              <img
                src={journals.user_profiles.avatar_url}
                alt={journals.user_profiles.full_name || 'Author'}
                className="relative h-12 w-12 rounded-full ring-2 ring-white dark:ring-neutral-800"
              />
            </div>
          ) : (
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-neutral-800 to-neutral-600 text-white shadow-lg dark:from-neutral-200 dark:to-neutral-400 dark:text-neutral-900">
              <span className="text-lg font-bold">
                {journals.user_profiles.full_name?.[0] || '?'}
              </span>
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-neutral-900 dark:text-white">
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
