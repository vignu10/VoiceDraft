'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { MarkdownRenderer } from '@/components/blog-post/MarkdownRenderer';
import { ContentGate } from '@/components/ui/ContentGate';
import { useDialog } from '@/components/ui/dialog';
import { useContentGate } from '@/hooks/useContentGate';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAuthStore } from '@/stores/auth-store';
import { useGuestStore } from '@/stores/guest-store';
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
  Eye,
  Edit3,
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
  const id = params.id as string;
  const { showDialog } = useDialog();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { isGuestDraft, addGuestDraft } = useGuestStore();

  // Check authentication for draft editing (optional - guest users can edit)
  useRequireAuth({
    optional: true, // Allow guest users, but handle auth state changes
    onAuthRequired: () => {
      // If session expires while editing, show error
      setSaveStatus('error');
      setError({
        message: 'Your session has expired. Please sign in to continue editing.',
      });
    },
  });

  // Content gate hook
  const {
    showContentGate,
    scrollPercentage,
    isImmediateGate,
    setScrollPercentage,
    handleSignIn: handleGateSignIn,
    handleSignUp: handleGateSignUp,
    markAsGuestTrialDraft,
  } = useContentGate({
    draftId: id,
    onSignIn: () => router.push('/auth/signin'),
    onSignUp: () => router.push('/auth/signup'),
  });

  const [draft, setDraft] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mobileViewMode, setMobileViewMode] = useState<'edit' | 'preview'>('edit');

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

          // Check if this is a guest trial draft
          if (!isAuthenticated && isGuestDraft(id)) {
            markAsGuestTrialDraft();
          }
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

  // Strip the title from content for preview (same logic as blog post page)
  const getPreviewContent = (markdownContent: string, postTitle: string) => {
    if (!markdownContent || !postTitle) return markdownContent;

    const titleVariants = [
      `# ${postTitle}`,
      `# ${postTitle.replace(/[#*_\[\]]/g, '\\$&')}`,
    ];

    let cleanedContent = markdownContent;
    for (const variant of titleVariants) {
      const regex = new RegExp(`^${variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n`, 'im');
      cleanedContent = cleanedContent.replace(regex, '');
    }

    return cleanedContent.trim();
  };

  const previewContent = getPreviewContent(content, title);

  // Handle scroll for content gate - use page scroll instead of container scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        const percentage = Math.round((scrollTop / docHeight) * 100);
        setScrollPercentage(percentage);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [setScrollPercentage]);

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
      <div className="min-h-screen pb-16 lg:pb-0 bg-neutral-50 dark:bg-neutral-950">
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
                <h1 className="text-sm sm:text-base font-medium text-neutral-900 dark:text-neutral-100 truncate">
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
                <button
                  onClick={handlePublish}
                  disabled={publishLoading === 'loading'}
                  className="min-h-[44px] sm:min-h-[52px] px-6 sm:px-8 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 hover:from-primary-500 hover:via-primary-400 hover:to-primary-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                  title="Publish draft (Ctrl+P)"
                >
                  {publishLoading === 'loading' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                      <span>Publishing...</span>
                    </>
                  ) : publishLoading === 'success' ? (
                    <>
                      <Check className="w-4 h-4" aria-hidden="true" />
                      <span>Published!</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" aria-hidden="true" />
                      <span>Publish</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleUnpublish}
                  disabled={unpublishLoading === 'loading'}
                  className="hidden sm:flex min-h-[44px] px-6 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 font-semibold rounded-xl transition-all items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                  title="Unpublish draft (Ctrl+P)"
                >
                  {unpublishLoading === 'loading' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                      <span>Unpublishing...</span>
                    </>
                  ) : unpublishLoading === 'success' ? (
                    <>
                      <Check className="w-4 h-4" aria-hidden="true" />
                      <span>Unpublished!</span>
                    </>
                  ) : (
                    <>
                      <Archive className="w-4 h-4" aria-hidden="true" />
                      <span>Unpublish</span>
                    </>
                  )}
                </button>
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
      <main className="max-w-full mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Desktop: 50/50 split, no boxes, page scroll */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-8">
          {/* Editor Panel - Desktop - minimal, no box/border */}
          <div className="flex flex-col pr-4">
            <div className="space-y-4">
              <div>
                <Input
                  placeholder="Post title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-sm font-medium"
                  maxLength={200}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Textarea
                  placeholder="Start writing your post..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[calc(100vh-280px)] font-mono text-sm leading-relaxed"
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

          {/* Preview Panel - Desktop - no box, page scroll, matches published blog */}
          <div className="pl-4 border-l border-neutral-200/50 dark:border-neutral-800/50">
            <article className="blog-content">
              {/* Blog-style header matching real blog post */}
              <div className="px-8 py-6 border-b border-neutral-200/50 dark:border-neutral-800/50">
                {title ? (
                  <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-6 leading-tight">
                    {title}
                  </h1>
                ) : (
                  <h1 className="text-3xl font-bold text-neutral-400 dark:text-neutral-600 mb-6 leading-tight italic">
                    Untitled Post
                  </h1>
                )}

                {/* Meta info styled like real blog */}
                <div className="flex items-center flex-wrap gap-4 text-sm text-neutral-500 dark:text-neutral-400">
                  {draft.created_at && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 dark:bg-neutral-800">
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                      </svg>
                      <span className="font-medium">
                        {new Date(draft.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 dark:bg-neutral-800">
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                    </svg>
                    <span className="font-medium">{readingTime} min read</span>
                  </div>
                  <span className={`inline-flex items-center rounded-full bg-gradient-to-r from-neutral-800/10 to-neutral-600/5 px-3 py-1 text-sm font-semibold text-neutral-700 ring-1 ring-neutral-300 dark:from-neutral-200/10 dark:to-neutral-400/5 dark:text-neutral-300 dark:ring-neutral-700`}>
                    {draft.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>

              {/* Blog content - page scroll */}
              <div className="px-8 py-8">
                <MarkdownRenderer content={previewContent || '*Start writing to see your preview here...'} />
              </div>
            </article>
          </div>
        </div>

        {/* Mobile: Editor or Preview with toggle - full page, no boxes */}
        <div className="lg:hidden">
          {/* Mobile view toggle */}
          <div className="flex items-center justify-center mb-4">
            <div className="inline-flex items-center rounded-lg bg-neutral-200/80 p-1 dark:bg-neutral-800/80">
              <button
                onClick={() => setMobileViewMode('edit')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mobileViewMode === 'edit'
                    ? 'bg-white text-neutral-900 dark:bg-neutral-700 dark:text-neutral-100 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
                aria-label="Switch to edit mode"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => setMobileViewMode('preview')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mobileViewMode === 'preview'
                    ? 'bg-white text-neutral-900 dark:bg-neutral-700 dark:text-neutral-100 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
                aria-label="Switch to preview mode"
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>
            </div>
          </div>

          {/* Editor mode - full page, no box */}
          {mobileViewMode === 'edit' && (
            <div className="space-y-4">
              <div>
                <Input
                  placeholder="Post title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-sm font-medium"
                  maxLength={200}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Textarea
                  placeholder="Start writing your post..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[calc(100vh-300px)] font-mono text-sm leading-relaxed"
                  showCharacterCount={false}
                  aria-label="Draft content"
                />
                <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
                  <span>Markdown</span>
                  <span>{content.length.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Preview mode - full page, no box, matches published blog */}
          {mobileViewMode === 'preview' && (
            <article className="blog-content">
              {/* Blog-style header */}
              <div className="px-4 sm:px-6 pt-6 pb-4 border-b border-neutral-200 dark:border-neutral-800">
                {title ? (
                  <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4 leading-tight">
                    {title}
                  </h1>
                ) : (
                  <h1 className="text-2xl font-bold text-neutral-400 dark:text-neutral-600 mb-4 leading-tight italic">
                    Untitled Post
                  </h1>
                )}

                {/* Meta info */}
                <div className="flex items-center flex-wrap gap-4 text-sm text-neutral-500 dark:text-neutral-400">
                  {draft.created_at && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 dark:bg-neutral-800">
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                      </svg>
                      <time dateTime={draft.created_at}>
                        {new Date(draft.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </time>
                    </div>
                  )}
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 dark:bg-neutral-800">
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                    </svg>
                    <span className="font-medium">{readingTime} min read</span>
                  </div>
                  <span className={`inline-flex items-center rounded-full bg-gradient-to-r from-neutral-800/10 to-neutral-600/5 px-3 py-1 text-sm font-semibold text-neutral-700 ring-1 ring-neutral-300 dark:from-neutral-200/10 dark:to-neutral-400/5 dark:text-neutral-300 dark:ring-neutral-700`}>
                    {draft.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>

              {/* Blog content - page scroll */}
              <div className="px-4 sm:px-6 py-6">
                <MarkdownRenderer content={previewContent || '*Start writing to see your preview here...'} />
              </div>
            </article>
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

      {/* Content Gate for guest drafts */}
      <ContentGate
        visible={showContentGate}
        onSignIn={handleGateSignIn}
        onSignUp={handleGateSignUp}
        scrollPercentage={scrollPercentage}
        immediate={isImmediateGate}
      />
    </div>
    </WithBottomNav>
  );
}
