/**
 * Format date for display
 */
export function formatDate(dateString: string | null | undefined): string {
  // Handle null/undefined
  if (!dateString) {
    return 'Recently';
  }

  const date = new Date(dateString);

  // Check for invalid date
  if (isNaN(date.getTime())) {
    return 'Recently';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Handle future dates or dates before 1970 (Unix epoch)
  if (diffDays < 0 || date.getFullYear() < 1970) {
    return 'Recently';
  }

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Format reading time
 */
export function formatReadingTime(minutes: number): string {
  if (minutes < 1) return '1 min read';
  return `${minutes} min read`;
}

/**
 * Generate excerpt from content
 */
export function generateExcerpt(content: string, maxLength = 150): string {
  const cleaned = content.replace(/[#*`_\[\]]/g, '').slice(0, maxLength);
  return cleaned + (content.length > maxLength ? '...' : '');
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
