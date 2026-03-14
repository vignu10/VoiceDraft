'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { MarkdownRenderer } from '@/components/blog-post/MarkdownRenderer';
import { useDialog } from '@/components/ui/dialog';
import { api } from '@/lib/api-client';
import { WithBottomNav } from '@/components/layout/BottomNav';
import { Post } from '@/lib/types';
import {
  Save,
  Trash2,
  Send,
  Archive,
  ArrowLeft,
  Check,
  AlertCircle,
  RefreshCw,
  XCircle,
} from 'lucide-react';

type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';
type LoadingState = 'idle' | 'loading' | 'success' | 'error';

interface ErrorState {
  message: string;
  retry?: () => void;
}

export default function DraftEditorPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const { showDialog } = useDialog();

  const [draft, setDraft] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>(() =>
    searchParams?.get('mode') === 'preview' ? 'preview' : 'edit'
  );

  // Error and loading states for hardening
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ErrorState | null>(null);
  const [publishLoading, setPublishLoading] = useState<LoadingState>('idle');
  const [unpublishLoading, setUnpublishLoading] = useState<LoadingState>('idle');
  const [deleteLoading, setDeleteLoading] = useState<LoadingState>('idle');

  // Refs for hardening stale closures and cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const latestTitleRef = useRef(title);
  const latestContentRef = useRef(content);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep refs in sync with latest values (prevents stale closures)
  useEffect(() => {
    latestTitleRef.current = title;
    latestContentRef.current = content;
  }, [title, content]);

  // Cleanup function for aborting pending requests
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Fetch draft on mount with error handling
  useEffect(() => {
    const fetchDraft = async () => {
      setIsLoading(true);
      setError(null);

      // Create abort controller for this request
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await api.get(`/api/drafts/${id}`, {
          signal: controller.signal,
        });

        if (response.ok) {
          const data = await response.json();
          setDraft(data);
          setTitle(data.title || '');
          setContent(data.content || '');
          setSaveStatus('saved');
        } else if (response.status === 404) {
          setError({
            message: 'Draft not found. It may have been deleted.',
            retry: () => router.push('/drafts'),
          });
        } else if (response.status === 403) {
          setError({
            message: "You don't have permission to edit this draft.",
          });
        } else {
          setError({
            message: 'Failed to load draft. Please try again.',
            retry: () => fetchDraft(),
          });
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // Request was aborted, ignore
          return;
        }
        setError({
          message: 'Network error. Please check your connection and try again.',
          retry: () => fetchDraft(),
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDraft();
  }, [id, router]);

  // Auto-save with debounce - hardened with refs to prevent stale closures
  const debouncedSave = useCallback(() => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveStatus('unsaved');

    // Set new timeout
    saveTimeoutRef.current = setTimeout(async () => {
      // Use refs to get latest values (prevents stale closures)
      const currentTitle = latestTitleRef.current;
      const currentContent = latestContentRef.current;

      setSaveStatus('saving');

      try {
        const response = await api.patch(`/api/drafts/${id}`, {
          title: currentTitle,
          content: currentContent,
        });

        if (response.ok) {
          const updated = await response.json();
          setDraft(updated);
          setSaveStatus('saved');
        } else if (response.status === 401) {
          // Unauthorized - redirect to login
          setError({
            message: 'Please sign in to save changes.',
          });
          setSaveStatus('error');
          router.push('/auth/signin');
        } else {
          setSaveStatus('error');
        }
      } catch (error) {
        setSaveStatus('error');
      }
    }, 1000);
  }, [id, router]);

  // Auto-save on title change
  useEffect(() => {
    if (draft && title !== draft.title) {
      debouncedSave();
    }
  }, [title, draft, debouncedSave]);

  // Auto-save on content change
  useEffect(() => {
    if (draft && content !== draft.content) {
      debouncedSave();
    }
  }, [content, draft, debouncedSave]);

  const handleDelete = async () => {
    setDeleteLoading('loading');

    try {
      const response = await api.delete(`/api/drafts/${id}`);

      if (response.ok) {
        setDeleteLoading('success');
        // Close modal and navigate after brief delay for feedback
        setTimeout(() => {
          setShowDeleteModal(false);
          router.push('/drafts');
        }, 300);
      } else if (response.status === 403) {
        setDeleteLoading('error');
        setError({
          message: "You don't have permission to delete this draft.",
        });
      } else if (response.status === 404) {
        setDeleteLoading('error');
        setError({
          message: 'Draft not found. It may have already been deleted.',
          retry: () => router.push('/drafts'),
        });
      } else {
        setDeleteLoading('error');
        setError({
          message: 'Failed to delete draft. Please try again.',
        });
      }
    } catch (error) {
      setDeleteLoading('error');
      setError({
        message: 'Network error. Please check your connection and try again.',
      });
    }
  };

  const handlePublish = async () => {
    if (publishLoading === 'loading') return; // Prevent double-submit

    setPublishLoading('loading');

    try {
      const response = await api.patch(`/api/drafts/${id}`, { status: 'published' });

      if (response.ok) {
        const updated = await response.json();
        setDraft(updated);
        setPublishLoading('success');
        // Reset to idle after showing success state
        setTimeout(() => setPublishLoading('idle'), 2000);
      } else if (response.status === 403) {
        setPublishLoading('error');
        setError({
          message: "You don't have permission to publish this draft.",
        });
      } else {
        setPublishLoading('error');
        setError({
          message: 'Failed to publish draft. Please try again.',
        });
      }
    } catch (error) {
      setPublishLoading('error');
      setError({
        message: 'Network error. Please check your connection and try again.',
      });
    }
  };

  const handleUnpublish = async () => {
    if (unpublishLoading === 'loading') return; // Prevent double-submit

    setUnpublishLoading('loading');

    try {
      const response = await api.patch(`/api/drafts/${id}`, { status: 'draft' });

      if (response.ok) {
        const updated = await response.json();
        setDraft(updated);
        setUnpublishLoading('success');
        setTimeout(() => setUnpublishLoading('idle'), 2000);
      } else if (response.status === 403) {
        setUnpublishLoading('error');
        setError({
          message: "You don't have permission to unpublish this draft.",
        });
      } else {
        setUnpublishLoading('error');
        setError({
          message: 'Failed to unpublish draft. Please try again.',
        });
      }
    } catch (error) {
      setUnpublishLoading('error');
      setError({
        message: 'Network error. Please check your connection and try again.',
      });
    }
  };

  const handleManualSave = async () => {
    const confirmed = await showDialog({
      title: 'Save Changes',
      message: 'Save your current changes to this draft?',
      variant: 'default',
      confirmText: 'Save',
      onConfirm: async () => {
        setSaveStatus('saving');
        try {
          const response = await api.patch(`/api/drafts/${id}`, {
            title,
            content,
          });

          if (response.ok) {
            const updated = await response.json();
            setDraft(updated);
            setSaveStatus('saved');
          } else if (response.status === 401) {
            setError({
              message: 'Please sign in to save changes.',
            });
            setSaveStatus('error');
            router.push('/auth/signin');
          } else {
            setError({
              message: 'Failed to save changes. Please try again.',
            });
            setSaveStatus('error');
          }
        } catch (error) {
          setError({
            message: 'Network error. Please check your connection and try again.',
          });
          setSaveStatus('error');
        }
      },
    });

    return confirmed;
  };

  // Keyboard shortcuts for power users
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (saveStatus !== 'saving') {
          handleManualSave();
        }
      }

      // Ctrl/Cmd + P to publish/unpublish
      if ((e.ctrlKey || e.metaKey) && e.key === 'p' && !e.shiftKey) {
        e.preventDefault();
        if (draft?.status === 'draft' && publishLoading !== 'loading') {
          handlePublish();
        } else if (draft?.status === 'published' && unpublishLoading !== 'loading') {
          handleUnpublish();
        }
      }

      // Escape to close delete modal
      if (e.key === 'Escape' && showDeleteModal) {
        setShowDeleteModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [draft, saveStatus, publishLoading, unpublishLoading, showDeleteModal, handleManualSave, handlePublish, handleUnpublish]);

  const wordCount = content ? content.split(/\s+/).filter(Boolean).length : 0;
  const readingTime = Math.ceil(wordCount / 200);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="text-center">
          <div className="relative mx-auto mb-6">
            <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-xl" aria-hidden="true" />
            <div className="relative w-16 h-16 mx-auto border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          </div>
          <p className="text-neutral-600 dark:text-neutral-400 font-medium">Loading draft...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !draft) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4">
        <div className="max-w-md w-full text-center">
          <div className="relative mx-auto mb-6">
            <div className="absolute inset-0 bg-error-500/20 rounded-full blur-xl" aria-hidden="true" />
            <div className="relative w-16 h-16 mx-auto bg-error-500/10 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-error-500" aria-hidden="true" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Failed to Load Draft
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            {error.message}
          </p>
          {error.retry && (
            <Button onClick={error.retry} variant="primary" className="min-h-[44px]">
              <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Empty state (no draft found)
  if (!draft) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4">
        <div className="max-w-md w-full text-center">
          <div className="relative mx-auto mb-6">
            <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-xl" aria-hidden="true" />
            <div className="relative w-16 h-16 mx-auto bg-primary-500/10 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-primary-500" aria-hidden="true" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Draft Not Found
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            This draft may have been deleted or you don't have permission to view it.
          </p>
          <Button onClick={() => router.push('/drafts')} variant="primary" className="min-h-[44px]">
            Back to Drafts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <WithBottomNav>
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-16 lg:pb-0">
      {/* Error banner */}
      {error && saveStatus === 'error' && (
        <div className="bg-error-500/10 border-b border-error-500/20 px-4 py-3 bg-frosted" role="alert">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-error-500 flex-shrink-0" aria-hidden="true" />
            <p className="text-sm text-error-700 dark:text-error-300 flex-1">{error.message}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="text-error-600 hover:text-error-800 dark:text-error-400"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-frosted border-b border-neutral-200/50 dark:border-neutral-800/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <button
                onClick={() => router.push('/drafts')}
                className="min-h-[40px] sm:min-h-[44px] min-w-[40px] sm:min-w-[44px] flex items-center justify-center -ml-1 sm:-ml-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                aria-label="Back to drafts"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                  {draft.title || 'Untitled Draft'}
                </h1>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                  {saveStatus === 'saved' && (
                    <span className="flex items-center gap-1">
                      <Check className="w-3 h-3 text-success-500" aria-hidden="true" />
                      <span className="hidden sm:inline">Saved</span>
                      <span className="sm:hidden">Saved</span>
                    </span>
                  )}
                  {saveStatus === 'saving' && (
                    <span className="flex items-center gap-1">
                      <Save className="w-3 h-3 animate-spin" aria-hidden="true" />
                      <span>Saving...</span>
                    </span>
                  )}
                  {saveStatus === 'unsaved' && (
                    <span>Unsaved</span>
                  )}
                  {saveStatus === 'error' && (
                    <span className="flex items-center gap-1 text-error-500">
                      <AlertCircle className="w-3 h-3" aria-hidden="true" />
                      <span>Failed</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Publish/Unpublish button - primary action */}
              {draft.status === 'draft' ? (
                <Button
                  variant="primary"
                  onClick={handlePublish}
                  isLoading={publishLoading === 'loading'}
                  className="min-h-[40px] sm:min-h-[44px] px-3 sm:px-6"
                  title="Publish draft (Ctrl+P)"
                >
                  {publishLoading === 'success' ? (
                    <>
                      <Check className="w-4 h-4 sm:mr-1" aria-hidden="true" />
                      <span className="hidden sm:inline">Published!</span>
                      <Check className="sm:hidden w-4 h-4" aria-hidden="true" />
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 sm:mr-2" aria-hidden="true" />
                      <span className="hidden sm:inline">Publish</span>
                      <Send className="sm:hidden w-4 h-4" aria-hidden="true" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={handleUnpublish}
                  isLoading={unpublishLoading === 'loading'}
                  className="min-h-[40px] sm:min-h-[44px] px-3 sm:px-6 hidden sm:flex"
                  title="Unpublish draft (Ctrl+P)"
                >
                  {unpublishLoading === 'success' ? (
                    <>
                      <Check className="w-4 h-4 mr-2" aria-hidden="true" />
                      Unpublished!
                    </>
                  ) : (
                    <>
                      <Archive className="w-4 h-4 mr-2" aria-hidden="true" />
                      Unpublish
                    </>
                  )}
                </Button>
              )}

              {/* Delete button */}
              <Button
                variant="ghost"
                onClick={() => setShowDeleteModal(true)}
                className="text-neutral-600 hover:text-accent-600 dark:text-neutral-400 dark:hover:text-accent-400 min-h-[40px] sm:min-h-[44px] min-w-[40px] sm:min-w-[44px] px-2"
                aria-label="Delete draft"
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Mobile Edit/Preview Toggle */}
        <div className="lg:hidden mb-4">
          <div className="inline-flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
            <button
              onClick={() => setMobileView('edit')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mobileView === 'edit'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              Edit
            </button>
            <button
              onClick={() => setMobileView('preview')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mobileView === 'preview'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              Preview
            </button>
          </div>
        </div>

        {/* Side by side on desktop, toggle on mobile */}
        <div className="hidden lg:grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Editor Panel - Desktop */}
          <div className="flex flex-col">
            <div className="bg-gradient-card rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 overflow-hidden shadow-sm">
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                <div>
                  <Input
                    placeholder="Post title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-base sm:text-lg font-semibold"
                    maxLength={200}
                    autoFocus
                  />
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <Textarea
                    placeholder="Start writing your post..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[300px] sm:min-h-[400px] lg:min-h-[600px] font-mono text-sm leading-relaxed"
                    showCharacterCount={false}
                    aria-label="Draft content"
                  />
                  <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
                    <span>Markdown</span>
                    <span>{content.length.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Panel - Desktop */}
          <div className="flex flex-col">
            <div className="bg-gradient-card rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 overflow-hidden shadow-sm">
              <article className="blog-content p-4 sm:p-6 lg:p-8">
                {title ? (
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-neutral-900 dark:text-white mb-4 sm:mb-6 leading-tight">
                    {title}
                  </h1>
                ) : (
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-neutral-400 dark:text-neutral-600 mb-4 sm:mb-6 leading-tight italic" aria-label="Untitled post placeholder">
                    Untitled Post
                  </h1>
                )}

                <div className="flex items-center flex-wrap gap-x-3 sm:gap-x-4 gap-y-1 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mb-4 sm:mb-6 lg:mb-8 pb-4 sm:pb-6 lg:pb-8 border-b border-neutral-200 dark:border-neutral-700">
                  {draft.created_at && (
                    <time dateTime={draft.created_at}>
                      {new Date(draft.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </time>
                  )}
                  <span>{wordCount} words</span>
                  <span>{readingTime} min read</span>
                  <span className={draft.status === 'published' ? 'text-success-600 dark:text-success-400' : 'text-primary-600 dark:text-primary-400'}>
                    {draft.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </div>

                <MarkdownRenderer content={content || '*Start writing to see your preview here...'} />
              </article>
            </div>
          </div>
        </div>

        {/* Mobile: Show active view only */}
        <div className="lg:hidden">
          {/* Editor Panel - Mobile */}
          {mobileView === 'edit' && (
            <div className="bg-gradient-card rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 overflow-hidden shadow-sm">
              <div className="p-4 space-y-4">
                <div>
                  <Input
                    placeholder="Post title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-base font-semibold"
                    maxLength={200}
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Textarea
                    placeholder="Start writing your post..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[400px] font-mono text-sm leading-relaxed"
                    showCharacterCount={false}
                    aria-label="Draft content"
                  />
                  <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
                    <span>Markdown</span>
                    <span>{content.length.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preview Panel - Mobile */}
          {mobileView === 'preview' && (
            <div className="bg-gradient-card rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 overflow-hidden shadow-sm">
              <article className="blog-content p-4">
                {title ? (
                  <h1 className="text-xl font-bold text-neutral-900 dark:text-white mb-4 leading-tight">
                    {title}
                  </h1>
                ) : (
                  <h1 className="text-xl font-bold text-neutral-400 dark:text-neutral-600 mb-4 leading-tight italic" aria-label="Untitled post placeholder">
                    Untitled Post
                  </h1>
                )}

                <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400 mb-4 pb-4 border-b border-neutral-200 dark:border-neutral-700">
                  {draft.created_at && (
                    <time dateTime={draft.created_at}>
                      {new Date(draft.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </time>
                  )}
                  <span>{wordCount} words</span>
                  <span>{readingTime} min read</span>
                  <span className={draft.status === 'published' ? 'text-success-600 dark:text-success-400' : 'text-primary-600 dark:text-primary-400'}>
                    {draft.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </div>

                <MarkdownRenderer content={content || '*Start writing to see your preview here...'} />
              </article>
            </div>
          )}
        </div>
      </main>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          if (deleteLoading !== 'loading') {
            setShowDeleteModal(false);
          }
        }}
        title="Delete Draft"
        variant="destructive"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleteLoading === 'loading'}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={deleteLoading === 'loading'}
              disabled={deleteLoading === 'loading'}
            >
              {deleteLoading === 'loading' ? 'Deleting...' : 'Delete'}
            </Button>
          </>
        }
      >
        <p className="text-neutral-600 dark:text-neutral-400">
          Are you sure you want to delete "<span className="font-medium text-neutral-900 dark:text-neutral-100 line-clamp-1 inline-block max-w-[300px] align-bottom">{draft.title || 'Untitled Draft'}</span>"? This action cannot be undone.
        </p>
      </Modal>
    </div>
    </WithBottomNav>
  );
}
