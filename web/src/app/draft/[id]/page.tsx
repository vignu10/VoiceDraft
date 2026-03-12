'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Save,
  Eye,
  Edit3,
  Trash2,
  Send,
  Archive,
  ArrowLeft,
  Check,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { MarkdownRenderer } from '@/components/blog-post/MarkdownRenderer';
import { TagInput } from '@/components/tags/TagInput';
import { useDraftStore } from '@/stores/draft-store';
import { useTagStore } from '@/stores/tag-store';
import { Post, PostStatus } from '@/lib/types';

type ViewMode = 'edit' | 'preview';

export default function DraftEditorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { fetchTags } = useTagStore();

  const [draft, setDraft] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);

  // Fetch draft on mount
  useEffect(() => {
    const fetchDraft = async () => {
      try {
        const response = await fetch(`/api/drafts/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setDraft(data);
          setTitle(data.title || '');
          setContent(data.content || '');
          setTags(data.tags || []);
        } else {
          console.error('Failed to fetch draft');
        }
      } catch (error) {
        console.error('Error fetching draft:', error);
      }
    };

    fetchDraft();
  }, [id]);

  // Fetch tags on mount
  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // Auto-save with debounce
  const debouncedSave = useCallback(
    (() => {
      let timeout: NodeJS.Timeout;
      return async (newTitle: string, newContent: string, newTags: string[]) => {
        clearTimeout(timeout);
        setSaveStatus('unsaved');

        timeout = setTimeout(async () => {
          setIsSaving(true);
          setSaveStatus('saving');

          try {
            const response = await fetch(`/api/drafts/${id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('access_token')}`,
              },
              body: JSON.stringify({
                title: newTitle,
                content: newContent,
                tags: newTags,
              }),
            });

            if (response.ok) {
              const updated = await response.json();
              setDraft(updated);
              setSaveStatus('saved');
            } else {
              console.error('Failed to save draft');
              setSaveStatus('unsaved');
            }
          } catch (error) {
            console.error('Error saving draft:', error);
            setSaveStatus('unsaved');
          } finally {
            setIsSaving(false);
          }
        }, 1000);
      };
    })(),
    [id]
  );

  // Auto-save on title change
  useEffect(() => {
    if (draft && title !== draft.title) {
      debouncedSave(title, content, tags);
    }
  }, [title, content, tags, draft, debouncedSave]);

  // Auto-save on content change
  useEffect(() => {
    if (draft && content !== draft.content) {
      debouncedSave(title, content, tags);
    }
  }, [content, title, tags, draft, debouncedSave]);

  // Auto-save on tags change
  useEffect(() => {
    if (draft && tags !== draft.tags) {
      debouncedSave(title, content, tags);
    }
  }, [tags, title, content, draft, debouncedSave]);

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/drafts/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        router.push('/drafts');
      } else {
        console.error('Failed to delete draft');
      }
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  };

  const handlePublish = async () => {
    try {
      const response = await fetch(`/api/drafts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ status: 'published' }),
      });

      if (response.ok) {
        setDraft((prev) => (prev ? { ...prev, status: 'published' } : null));
        setShowPublishModal(false);
      } else {
        console.error('Failed to publish draft');
      }
    } catch (error) {
      console.error('Error publishing draft:', error);
    }
  };

  const handleArchive = async () => {
    try {
      const response = await fetch(`/api/drafts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ status: 'archived' }),
      });

      if (response.ok) {
        setDraft((prev) => (prev ? { ...prev, status: 'archived' } : null));
      } else {
        console.error('Failed to archive draft');
      }
    } catch (error) {
      console.error('Error archiving draft:', error);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/drafts/${id}/export`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${draft?.title || 'draft'}.md`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Failed to export draft');
      }
    } catch (error) {
      console.error('Error exporting draft:', error);
    }
  };

  const wordCount = content ? content.split(/\s+/).filter(Boolean).length : 0;
  const readingTime = Math.ceil(wordCount / 200);

  if (!draft) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">Loading draft...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 -ml-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  Draft Editor
                </h1>
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  {saveStatus === 'saved' && (
                    <span className="flex items-center gap-1">
                      <Check className="w-3 h-3 text-green-500" />
                      Saved
                    </span>
                  )}
                  {saveStatus === 'saving' && (
                    <span className="flex items-center gap-1">
                      <Save className="w-3 h-3 animate-spin" />
                      Saving...
                    </span>
                  )}
                  {saveStatus === 'unsaved' && (
                    <span className="flex items-center gap-1">
                      Unsaved changes
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View mode toggle */}
              <div className="hidden sm:flex items-center border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('edit')}
                  className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 transition-colors ${
                    viewMode === 'edit'
                      ? 'bg-primary-500 text-white'
                      : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => setViewMode('preview')}
                  className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 transition-colors ${
                    viewMode === 'preview'
                      ? 'bg-primary-500 text-white'
                      : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
              </div>

              {/* Delete button */}
              <button
                onClick={() => setShowDeleteModal(true)}
                className="p-2 text-neutral-600 hover:text-accent-600 dark:text-neutral-400 dark:hover:text-accent-400"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Editor area */}
          <div className="lg:col-span-3">
            {viewMode === 'edit' ? (
              <div className="space-y-6">
                <Input
                  placeholder="Draft title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-2xl font-semibold"
                />

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Tags
                  </label>
                  <TagInput
                    selectedTags={tags}
                    onTagsChange={setTags}
                    placeholder="Add tags to organize your draft..."
                  />
                </div>

                <Textarea
                  placeholder="Start writing your draft... (Markdown supported)"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[500px] font-mono text-sm"
                  showCharacterCount={false}
                />
              </div>
            ) : (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 border border-neutral-200 dark:border-neutral-800">
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-6">
                  {title || 'Untitled Draft'}
                </h1>
                <MarkdownRenderer content={content || '*No content yet*'} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Stats */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                Stats
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Words</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {wordCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Reading time</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {readingTime} min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Status</span>
                  <span className={`font-medium ${
                    draft.status === 'published' ? 'text-green-600' :
                    draft.status === 'archived' ? 'text-neutral-600' :
                    'text-neutral-900 dark:text-neutral-100'
                  }`}>
                    {draft.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                Actions
              </h3>
              <div className="space-y-2">
                {draft.status === 'draft' && (
                  <Button
                    fullWidth
                    onClick={() => setShowPublishModal(true)}
                    className="justify-start"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Publish
                  </Button>
                )}
                {draft.status === 'published' && (
                  <Button
                    fullWidth
                    variant="secondary"
                    onClick={handleArchive}
                    className="justify-start"
                  >
                    <Archive className="w-4 h-4 mr-2" />
                    Archive
                  </Button>
                )}
                <Button
                  fullWidth
                  variant="ghost"
                  href={`/api/drafts/${id}/transcript`}
                  className="justify-start"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Generate Blog
                </Button>
                <Button
                  fullWidth
                  variant="ghost"
                  onClick={handleExport}
                  className="justify-start"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Markdown
                </Button>
              </div>
            </div>

            {/* Draft info */}
            {draft.created_at && (
              <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                  Created
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {new Date(draft.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Draft"
        variant="destructive"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-neutral-600 dark:text-neutral-400">
          Are you sure you want to delete "{draft.title || 'Untitled Draft'}"? This action cannot be undone.
        </p>
      </Modal>

      {/* Publish confirmation modal */}
      <Modal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        title="Publish Draft"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowPublishModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePublish}
            >
              Publish
            </Button>
          </>
        }
      >
        <p className="text-neutral-600 dark:text-neutral-400">
          This will publish "{draft.title || 'Untitled Draft'}" to your blog. Continue?
        </p>
      </Modal>
    </div>
  );
}
