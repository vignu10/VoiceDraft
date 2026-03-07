import Constants from 'expo-constants';

/**
 * Production URL for the web app
 * Retrieved from app config, falls back to default if not configured
 */
const PRODUCTION_URL = Constants.expoConfig?.extra?.productionUrl || 'https://your-site.com';

/**
 * Regular expression pattern for validating URL-friendly identifiers
 * Allows lowercase letters, numbers, and hyphens only
 */
const VALID_ID_PATTERN = /^[a-z0-9-]+$/;

/**
 * Generate the blog URL for a published post
 *
 * @param journalUrlPrefix - The URL prefix for the journal (e.g., 'my-journal')
 * @param postSlug - The slug identifying the specific post (e.g., 'my-first-post')
 * @returns The complete URL for the blog post
 *
 * @example
 * generateBlogUrl('my-journal', 'my-first-post')
 * // Returns: 'https://your-site.com/my-journal/my-first-post'
 */
export function generateBlogUrl(journalUrlPrefix: string, postSlug: string): string {
  return `${PRODUCTION_URL}/${journalUrlPrefix}/${postSlug}`;
}

/**
 * Get the base URL for the app
 *
 * @returns The production base URL
 *
 * @example
 * getBaseUrl()
 * // Returns: 'https://your-site.com'
 */
export function getBaseUrl(): string {
  return PRODUCTION_URL;
}

/**
 * Validate if a URL prefix is valid (alphanumeric and hyphens only)
 *
 * @param prefix - The URL prefix to validate
 * @returns true if the prefix contains only lowercase letters, numbers, and hyphens; false otherwise
 *
 * @example
 * isValidUrlPrefix('my-journal')  // Returns: true
 * isValidUrlPrefix('My-Journal')  // Returns: false (uppercase)
 * isValidUrlPrefix('my_journal')  // Returns: false (underscore)
 */
export function isValidUrlPrefix(prefix: string): boolean {
  return VALID_ID_PATTERN.test(prefix);
}

/**
 * Validate if a slug is valid
 *
 * @param slug - The slug to validate
 * @returns true if the slug is non-empty and contains only lowercase letters, numbers, and hyphens; false otherwise
 *
 * @example
 * isValidSlug('my-first-post')  // Returns: true
 * isValidSlug('')               // Returns: false (empty)
 * isValidSlug('My-Post')        // Returns: false (uppercase)
 */
export function isValidSlug(slug: string): boolean {
  return VALID_ID_PATTERN.test(slug) && slug.length > 0;
}
