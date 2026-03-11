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
    <div className="sticky top-0 z-10 border-b-2 border-neutral-200/80 bg-white/95 backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-950/95 shadow-sm">
      <div className="container-wide py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Bold Search Input */}
          <div className="relative flex-1 max-w-md">
            <label htmlFor="blogs-search" className="sr-only">Search blogs</label>
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
              id="blogs-search"
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search blogs..."
              className="w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-3 pl-11 text-sm font-medium text-neutral-900 placeholder-neutral-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500 dark:focus:border-primary-500"
            />
          </div>

          {/* Bold Sort Options with ARIA grouping */}
          <div className="flex items-center gap-3" role="group" aria-label="Sort blogs by">
            <span id="sort-label" className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Sort</span>
            <div className="flex rounded-xl border-2 border-neutral-300 bg-white p-1 dark:border-neutral-700 dark:bg-neutral-800">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value)}
                  aria-pressed={selectedSort === option.value}
                  aria-describedby="sort-label"
                  className={`rounded-lg px-4 py-2 text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                    selectedSort === option.value
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
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
