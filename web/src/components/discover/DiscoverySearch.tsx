'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { SearchIcon } from 'lucide-react';

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
    // Sort selection is handled by parent components via URL params
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Search is debounced by parent components
  };

  return (
    <div className="sticky top-0 z-10 border-b border-neutral-200/60 bg-white/90 backdrop-blur-sm dark:border-neutral-800/60 dark:bg-neutral-950/90">
      <div className="container-wide">
        <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:py-5">
          {/* Search input - using Input component */}
          <div className="relative flex-1 w-full max-w-md">
            <Input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Find creators, topics..."
              leftIcon={<SearchIcon className="h-4 w-4" />}
              className="!bg-white/50 dark:!bg-neutral-900/50 hover:!bg-white dark:hover:!bg-neutral-900/50"
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
                  className={`px-4 py-2.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2 min-h-[44px] ${
                    selectedSort === option.value
                      ? 'bg-primary-500 text-white dark:bg-primary-400 dark:text-neutral-900'
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
