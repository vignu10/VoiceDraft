'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DraftCard } from '@/components/drafts/DraftCard';
import { useDraftStore } from '@/stores/draft-store';
import { PostStatus } from '@/lib/types';
import {
  SearchIcon,
  GridIcon,
  ListIcon,
  FilterIcon,
  PlusIcon,
} from 'lucide-react';

const filterOptions = [
  { value: 'all', label: 'All Drafts' },
  { value: 'draft', label: 'Drafts' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

const sortOptions = [
  { value: 'date-desc', label: 'Newest First' },
  { value: 'date-asc', label: 'Oldest First' },
  { value: 'title-asc', label: 'Title A-Z' },
  { value: 'title-desc', label: 'Title Z-A' },
  { value: 'wordCount-desc', label: 'Most Words' },
  { value: 'wordCount-asc', label: 'Fewest Words' },
];

export default function DraftsPage() {
  const {
    filteredDrafts,
    isLoading,
    error,
    filter,
    sortBy,
    sortOrder,
    fetchDrafts,
    setFilter,
    setSortBy,
    toggleSortOrder,
    deleteDraft,
    publishDraft,
  } = useDraftStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const handleSortChange = (value: string) => {
    const [field, order] = value.split('-') as [typeof sortBy, typeof sortOrder];
    setSortBy(field);
    if (order !== sortOrder) {
      toggleSortOrder();
    }
  };

  const filteredAndSearchedDrafts = filteredDrafts().filter((draft) =>
    draft.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    draft.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-20">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                My Drafts
              </h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {filteredAndSearchedDrafts.length}{' '}
                {filteredAndSearchedDrafts.length === 1 ? 'draft' : 'drafts'}
              </p>
            </div>

            <Button href="/record">
              <PlusIcon className="w-5 h-5 mr-2" />
              New Recording
            </Button>
          </div>

          {/* Search and filters */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search drafts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<SearchIcon className="w-5 h-5" />}
              />
            </div>

            <div className="flex gap-3">
              <Select
                options={filterOptions}
                value={filter}
                onChange={(v) => setFilter(v as PostStatus | 'all')}
                className="w-40"
              />

              <Select
                options={sortOptions}
                value={`${sortBy}-${sortOrder}`}
                onChange={handleSortChange}
                className="w-40"
              />

              <div className="flex items-center border border-neutral-300 dark:border-neutral-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 transition-colors',
                    viewMode === 'grid'
                      ? 'bg-primary-500 text-white'
                      : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  )}
                  aria-label="Grid view"
                >
                  <GridIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2 transition-colors',
                    viewMode === 'list'
                      ? 'bg-primary-500 text-white'
                      : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  )}
                  aria-label="List view"
                >
                  <ListIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-accent-50 dark:bg-accent-950 rounded-xl">
            <p className="text-sm text-accent-600 dark:text-accent-400">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 h-48 animate-pulse"
              />
            ))}
          </div>
        ) : filteredAndSearchedDrafts.length === 0 ? (
          <div className="text-center py-16">
            <svg
              className="mx-auto h-16 w-16 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              No drafts yet
            </h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              {searchQuery
                ? 'Try a different search term'
                : 'Create your first draft by recording your voice'}
            </p>
            {!searchQuery && (
              <Button href="/record" className="mt-4">
                <PlusIcon className="w-5 h-5 mr-2" />
                Start Recording
              </Button>
            )}
          </div>
        ) : (
          <div
            className={cn(
              'grid gap-4',
              viewMode === 'grid'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1'
            )}
          >
            {filteredAndSearchedDrafts.map((draft) => (
              <DraftCard
                key={draft.id}
                draft={draft}
                onDelete={deleteDraft}
                onPublish={publishDraft}
              />
            ))}
          </div>
        )}
      </main>

      {/* Bottom navigation */}
      <nav
        role="navigation"
        aria-label="Main navigation"
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-around py-2">
            <button className="flex flex-col items-center px-4 py-2 text-neutral-600 dark:text-neutral-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
              <span className="text-xs mt-1 font-medium">Record</span>
            </button>
            <button
              className="flex flex-col items-center px-4 py-2 text-primary-600"
              aria-current="page"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span className="text-xs mt-1 font-medium">Drafts</span>
            </button>
            <button className="flex flex-col items-center px-4 py-2 text-neutral-600 dark:text-neutral-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S13.284 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.716 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.424-3.113 1.167-4.418" />
              </svg>
              <span className="text-xs mt-1 font-medium">Discover</span>
            </button>
            <button className="flex flex-col items-center px-4 py-2 text-neutral-600 dark:text-neutral-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632m0 0A9.015 9.015 0 013 12c0-1.605.424-3.113 1.167-4.418" />
              </svg>
              <span className="text-xs mt-1 font-medium">Profile</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
