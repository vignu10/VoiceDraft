'use client';

import { useState, useEffect } from 'react';
import type { SortOption } from '@/types/blog';

interface BlogControlsProps {
  onSearchChange?: (search: string) => void;
  onSortChange?: (sort: SortOption) => void;
  initialSort?: SortOption;
}

export function BlogControls({
  onSearchChange,
  onSortChange,
  initialSort = 'newest',
}: BlogControlsProps) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>(initialSort);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Notify parent when debounced search changes
  useEffect(() => {
    onSearchChange?.(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'title', label: 'A-Z' },
  ];

  return (
    <div className="sticky top-0 z-10 border-b-2 border-neutral-200/80 bg-white/95 backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-950/95 shadow-sm">
      <div className="container-wide py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Bold Search Input */}
          <div className="relative flex-1 max-w-md">
            <label htmlFor="posts-search" className="sr-only">Search posts</label>
            <svg
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              id="posts-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts..."
              className="w-full rounded-xl border-2 border-neutral-300 bg-white py-3 pl-11 pr-4 text-sm font-medium text-neutral-900 placeholder-neutral-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500 dark:focus:border-primary-500"
            />
          </div>

          {/* Bold Sort Dropdown */}
          <div className="flex items-center gap-3">
            <label htmlFor="sort" className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
              Sort by
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => {
                const newSort = e.target.value as SortOption;
                setSort(newSort);
                onSortChange?.(newSort);
              }}
              className="rounded-xl border-2 border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-primary-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
