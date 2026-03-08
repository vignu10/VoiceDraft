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
    <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-950/95">
      <div className="container-wide py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search blogs..."
              aria-label="Search blogs"
              className="w-full rounded-full border border-neutral-300 bg-white px-4 py-2 pl-10 text-sm text-neutral-900 placeholder-neutral-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500"
            />
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
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
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Sort</span>
            <div className="flex rounded-full border border-neutral-300 bg-white p-0.5 dark:border-neutral-700 dark:bg-neutral-800">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value)}
                  aria-pressed={selectedSort === option.value}
                  className={`rounded-full px-4 py-2 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 ${
                    selectedSort === option.value
                      ? 'bg-accent text-white'
                      : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700'
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
