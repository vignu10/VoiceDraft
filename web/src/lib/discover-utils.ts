import type { BlogDiscoveryCard } from '@/types/discover';

/**
 * Truncate text to max length with ellipsis
 */
export function truncate(text: string | null, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Format post count for display
 */
export function formatPostCount(count: number): string {
  if (count === 1) return '1 post';
  return `${count} posts`;
}

/**
 * Generate initials from name for avatar fallback
 */
export function getInitials(name: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
