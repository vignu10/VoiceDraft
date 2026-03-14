'use client';

import { useState } from 'react';

type DiscoverySort = 'newest' | 'active' | 'posts';

const sortOptions: { value: DiscoverySort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'active', label: 'Active' },
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
    <div className="sticky top-0 z-10 border-b border-neutral-200/60 bg-white/90 backdrop-blur-sm dark:border-neutral-800/60 dark:bg-neutral-950/90">
      <div className="container-wide">
        <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:py-5">
          {/* Search input - editorial style */}
          <div className="relative flex-1 w-full max-w-md">
            <label htmlFor="blogs-search" className="sr-only">Search</label>
            <svg
              className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 pointer-events-none"
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
              id="blogs-search"
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Find creators, topics..."
              className="w-full rounded-lg border border-neutral-300 bg-white/50 px-4 py-2.5 pl-10 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus:border-accent-500 focus:bg-white focus:outline-none dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-white dark:focus:border-accent-400"
            />
          </div>

          {/* Sort options - minimal pill design */}
          <div className="flex items-center gap-2" role="group" aria-label="Sort by">
            <span className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Sort</span>
            <div className="flex rounded-lg border border-neutral-200 bg-white p-0.5 dark:border-neutral-800 dark:bg-neutral-900">
              {sortOptions.map((option, index) => (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value)}
                  aria-pressed={selectedSort === option.value}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500/50 ${
                    selectedSort === option.value
                      ? 'bg-accent-500 text-white'
                      : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
                  } ${index === 0 ? 'rounded-l-md' : index === sortOptions.length - 1 ? 'rounded-r-md' : ''}`}
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
