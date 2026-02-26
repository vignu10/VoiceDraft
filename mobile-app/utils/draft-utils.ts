/**
 * Draft Utility Functions
 *
 * Centralized utility functions for draft operations.
 * Extracted from library.tsx (lines 260-298).
 */

import { Palette } from '@/constants/design-system';
import type { Draft } from '@/types/draft';

export type SortOption = 'date' | 'title';

/**
 * Get accent color for a draft based on index for playful variety
 *
 * @param index - The draft index
 * @returns Accent color object with primary, light, and gradient colors
 */
export function getDraftAccent(index: number): {
  primary: string;
  light: string;
  gradient: string[];
} {
  const accents = [
    { primary: Palette.periwinkle[500], light: Palette.periwinkle[50], gradient: ['#8B5CF6', '#A78BFA'] },
    { primary: Palette.coral[500], light: Palette.coral[50], gradient: ['#EC5D72', '#FFA8B4'] },
    { primary: Palette.teal[500], light: Palette.teal[50], gradient: ['#14B8A6', '#5EEAD4'] },
  ];
  return accents[index % accents.length];
}

/**
 * Sort drafts by the specified option
 *
 * @param drafts - The drafts to sort
 * @param sortBy - The sort option ('date' | 'title')
 * @returns Sorted drafts array
 */
export function sortDrafts(drafts: Draft[], sortBy: SortOption): Draft[] {
  return [...drafts].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return (a.title || '').localeCompare(b.title || '');
  });
}

/**
 * Filter drafts by search query
 *
 * @param drafts - The drafts to filter
 * @param query - The search query string
 * @returns Filtered drafts array
 */
export function filterDrafts(drafts: Draft[], query: string): Draft[] {
  if (!query) return drafts;

  const lowerQuery = query.toLowerCase();
  return drafts.filter((draft) => {
    return (
      draft.title?.toLowerCase().includes(lowerQuery) ||
      draft.content?.toLowerCase().includes(lowerQuery) ||
      draft.targetKeyword?.toLowerCase().includes(lowerQuery)
    );
  });
}

/**
 * Sort and filter drafts combined
 *
 * @param drafts - The drafts to sort and filter
 * @param searchQuery - The search query string
 * @param sortBy - The sort option
 * @returns Sorted and filtered drafts array
 */
export function sortAndFilterDrafts(
  drafts: Draft[],
  searchQuery: string,
  sortBy: SortOption
): Draft[] {
  const filtered = filterDrafts(drafts, searchQuery);
  return sortDrafts(filtered, sortBy);
}
