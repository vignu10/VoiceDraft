'use client';

import Link from 'next/link';
import { Card, CardBody } from '@/components/ui/Card';
import { Post } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { useDialog } from '@/components/ui/dialog';

interface DraftCardProps {
  draft: Post;
  onDelete?: (id: string) => void;
  onPublish?: (id: string) => void;
  onUnpublish?: (id: string) => void;
}

const statusStyles = {
  draft: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  published: 'bg-success-100 text-success-700 dark:bg-success-950/50 dark:text-success-300',
  archived: 'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
};

export function DraftCard({ draft, onDelete, onPublish, onUnpublish }: DraftCardProps) {
  const { showDialog } = useDialog();
  const excerpt = draft.content?.slice(0, 120) + (draft.content?.length > 120 ? '...' : '');

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();

    // If post is published, warn user to unpublish first (like Medium)
    if (draft.status === 'published') {
      const shouldUnpublish = await showDialog({
        title: 'Published Post Detected',
        message: 'This post is currently published. Please unpublish it first before deleting.',
        variant: 'default',
        confirmText: 'Unpublish Now',
        cancelText: 'Cancel',
      });

      if (shouldUnpublish && onUnpublish) {
        try {
          await onUnpublish(draft.id);
        } catch (error) {
          console.error('[DraftCard] Failed to unpublish:', error);
          await showDialog({
            title: 'Unpublish Failed',
            message: 'Failed to unpublish this post. Please try again.',
            variant: 'destructive',
            confirmText: 'OK',
            cancelText: 'Cancel',
          });
        }
      }
      return; // Exit without deleting - user must explicitly delete again
    }

    // Normal delete flow for unpublished drafts
    const confirmed = await showDialog({
      title: 'Delete Draft',
      message: `Are you sure you want to delete "${draft.title || 'Untitled Draft'}"? This action cannot be undone.`,
      variant: 'destructive',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
    if (confirmed && onDelete) {
      onDelete(draft.id);
    }
  };

  return (
    <Card variant="draft" interactive className="overflow-hidden">
      <CardBody className="p-0">
        <Link href={`/draft/${draft.id}?mode=preview`}>
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
                <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 line-clamp-2 sm:text-2xl">
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
              <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3 sm:text-base">
                {excerpt}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between px-4 py-3 bg-frosted border-t border-neutral-100/50 dark:border-neutral-800/50">
            <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
              View draft
            </span>

            <div className="flex items-center gap-3">
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

              {draft.status === 'published' && onUnpublish && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onUnpublish(draft.id);
                  }}
                  className="p-2 text-neutral-600 hover:text-accent-600 transition-colors"
                  aria-label={`Unpublish ${draft.title}`}
                  title="Unpublish"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.825 0 1.63-.09 2.404-.249m-3.397-3.397A3 3 0 009.5 12.002c0-1.452.986-2.677 2.334-3.03M14.938 14.938A9.962 9.962 0 0112 15c-4.638 0-8.573-3.007-9.963-7.178a10.48 10.48 0 011.858-2.654m4.065-4.065A9.957 9.957 0 0112 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 2.25l19.5 19.5" />
                  </svg>
                </button>
              )}

              {onDelete && (
                <button
                  onClick={handleDelete}
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
