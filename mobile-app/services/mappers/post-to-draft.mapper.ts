/**
 * Post to Draft Mapper
 *
 * Centralized mapper for converting Post objects to Draft format.
 * Eliminates duplicate mapping logic from library.tsx (lines 63-80) and use-api.ts (lines 47-66).
 */

import type { Draft, Post } from '@/types/draft';

/**
 * Map a single Post to Draft format
 *
 * @param post - The Post object from the API
 * @returns A Draft object for local display
 */
export function mapPostToDraft(post: Post): Draft {
  return {
    id: post.id,
    serverId: post.id,
    journalId: post.journal_id,
    status: post.status === 'published' ? 'published' : 'ready',
    title: post.title,
    metaDescription: post.meta_description,
    content: post.content,
    targetKeyword: post.target_keyword,
    transcript: post.transcript,
    wordCount: post.word_count,
    tone: 'professional', // Default, would be mapped from style_used
    length: 'medium', // Default, would be mapped from style_used
    isFavorite: false,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
    syncedAt: post.updated_at,
  };
}

/**
 * Map an array of Posts to Drafts
 *
 * @param posts - Array of Post objects from the API
 * @returns Array of Draft objects for local display
 */
export function mapPostsToDrafts(posts: Post[]): Draft[] {
  return posts.map(mapPostToDraft);
}
