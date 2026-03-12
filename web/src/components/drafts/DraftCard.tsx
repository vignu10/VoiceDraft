'use client';

import Link from 'next/link';
import { Card, CardBody } from '@/components/ui/Card';
import { Post } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

interface DraftCardProps {
  draft: Post;
  onDelete?: (id: string) => void;
  onPublish?: (id: string) => void;
}

const statusStyles = {
  draft: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  archived: 'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
};

export function DraftCard({ draft, onDelete, onPublish }: DraftCardProps) {
  const excerpt = draft.content?.slice(0, 120) + (draft.content?.length > 120 ? '...' : '');

  return (
    <Card variant="draft" interactive className="overflow-hidden">
      <CardBody className="p-0">
        <Link href={`/draft/${draft.id}`}>
          {/* Header */}
          <div className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Status badge */}
                <span
                  className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-2',
                    statusStyles[draft.status]
                  )}
                >
                  {draft.status}
                </span>

                {/* Title */}
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2">
                  {draft.title}
                </h3>

                {/* Meta */}
                <div className="flex items-center gap-4 mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <span>{draft.word_count} words</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(draft.created_at), { addSuffix: true })}</span>
                </div>
              </div>

              {/* Audio indicator */}
              {draft.audio_file_url && (
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-primary-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Excerpt */}
            {draft.content && (
              <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3">
                {excerpt}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-100 dark:border-neutral-800">
            <Link
              href={`/draft/${draft.id}`}
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              Edit draft
            </Link>

            <div className="flex items-center gap-2">
              {draft.status === 'draft' && onPublish && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onPublish(draft.id);
                  }}
                  className="p-2 text-neutral-600 hover:text-primary-600 transition-colors"
                  aria-label={`Publish ${draft.title}`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}

              {onDelete && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (confirm(`Delete "${draft.title}"?`)) {
                      onDelete(draft.id);
                    }
                  }}
                  className="p-2 text-neutral-600 hover:text-accent-600 transition-colors"
                  aria-label={`Delete ${draft.title}`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </Link>
      </CardBody>
    </Card>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
