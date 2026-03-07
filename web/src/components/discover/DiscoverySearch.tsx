'use client';

import { useState } from 'react';

type DiscoverySort = 'newest' | 'active' | 'posts';

const sortOptions: { value: DiscoverySort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'active', label: 'Most Active' },
  { value: 'posts', label: 'Most Posts' },
];

interface DiscoverySearchProps {
  initialSort?: DiscoverySort;
}

export function DiscoverySearch({ initialSort = 'newest' }: DiscoverySearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState<DiscoverySort>(initialSort);

  const handleSortChange = (sort: DiscoverySort) => {
    setSelectedSort(sort);
    // TODO: Trigger re-fetch of blogs with new sort
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // TODO: Implement search debouncing and filtering
  };

  return (
    <div className="sticky top-0 z-10 border-b border-stone-200 bg-white/95 backdrop-blur-sm dark:border-stone-800 dark:bg-stone-900/95">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search blogs..."
              aria-label="Search blogs"
              className="w-full rounded-full border border-stone-300 bg-white px-4 py-2 pl-10 text-sm text-stone-900 placeholder-stone-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder-stone-400"
            />
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-stone-600 dark:text-stone-400">Sort by:</span>
            <div className="flex rounded-full border border-stone-300 bg-white p-1 dark:border-stone-700 dark:bg-stone-800">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value)}
                  aria-pressed={selectedSort === option.value}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    selectedSort === option.value
                      ? 'bg-amber-600 text-white'
                      : 'text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
