/**
 * Draft Creation Service
 *
 * Centralized logic for creating drafts from generated blog content.
 * Eliminates duplicate code from processing.tsx (lines 283-461 and 467-657).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CreatePostData } from '@/services/api/posts';
import type { Draft, GeneratedBlog, Length, Tone } from '@/types/draft';

// Processing parameters for draft creation
export interface ProcessingParams {
  keyword?: string;
  tone: Tone;
  length: Length;
  audioUri?: string;
  duration?: string;
}

/**
 * Create a guest draft object from generated blog content
 *
 * @param blog - The generated blog content
 * @param transcript - The transcription text
 * @param params - Processing parameters
 * @returns A Draft object for guest flow
 */
export function createGuestDraft(
  blog: GeneratedBlog,
  transcript: string,
  params: ProcessingParams
): Draft {
  const guestDraftId = `guest-${Date.now()}`;

  return {
    id: guestDraftId,
    status: 'ready',
    title: blog.title,
    content: blog.content,
    metaDescription: blog.metaDescription,
    transcript,
    targetKeyword: params.keyword,
    tone: params.tone,
    length: params.length,
    wordCount: blog.wordCount,
    isFavorite: false,
    isGuestDraft: true, // Mark for content gating
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Create a local draft reference for authenticated users
 * Used for the Continue Draft feature (temporary cache)
 *
 * @param id - The server post ID
 * @param blog - The generated blog content
 * @param transcript - The transcription text
 * @param params - Processing parameters
 * @returns A Draft object for local caching
 */
export function createLocalDraft(
  id: string,
  blog: GeneratedBlog,
  transcript: string,
  params: ProcessingParams
): Draft {
  return {
    id,
    status: 'ready',
    audioDuration: params.duration ? parseInt(params.duration, 10) : undefined,
    transcript,
    targetKeyword: params.keyword,
    tone: params.tone,
    length: params.length,
    title: blog.title,
    metaDescription: blog.metaDescription,
    content: blog.content,
    wordCount: blog.wordCount,
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Build create post data for API
 *
 * @param blog - The generated blog content
 * @param transcript - The transcription text
 * @param params - Processing parameters
 * @returns CreatePostData for the API call
 */
export function buildCreatePostData(
  blog: GeneratedBlog,
  transcript: string,
  params: ProcessingParams
): CreatePostData {
  return {
    title: blog.title,
    content: blog.content,
    meta_description: blog.metaDescription,
    transcript,
    target_keyword: params.keyword,
    tone: params.tone,
    length: params.length,
  };
}

/**
 * Save a guest draft to AsyncStorage
 * Adds to the 'guest-drafts' array
 *
 * @param draft - The draft to save
 */
export async function saveGuestDraftToStorage(draft: Draft): Promise<void> {
  const existingGuestDrafts = await AsyncStorage.getItem('guest-drafts');
  const guestDrafts = existingGuestDrafts ? JSON.parse(existingGuestDrafts) : [];
  guestDrafts.unshift(draft);
  await AsyncStorage.setItem('guest-drafts', JSON.stringify(guestDrafts));
}

/**
 * Save an authenticated draft to AsyncStorage
 * Used for Continue Draft feature (temporary cache)
 *
 * @param draft - The draft to save
 * @returns isFirstDraft - Whether this is the first draft
 */
export async function saveDraftToStorage(draft: Draft): Promise<boolean> {
  const existingDrafts = await AsyncStorage.getItem('drafts');
  const drafts = existingDrafts ? JSON.parse(existingDrafts) : [];
  const isFirstDraft = drafts.length === 0;
  drafts.unshift(draft);
  await AsyncStorage.setItem('drafts', JSON.stringify(drafts));
  return isFirstDraft;
}

/**
 * Validate transcript has meaningful content
 *
 * @param text - The transcript text to validate
 * @returns Validation result with optional reason
 */
export function validateTranscript(text: string): { valid: boolean; reason?: string } {
  const trimmed = text.trim();

  // Check if empty
  if (!trimmed) {
    return {
      valid: false,
      reason: 'No speech was detected in your recording. Please try again and speak clearly into the microphone.',
    };
  }

  // Check minimum length
  const MIN_TRANSCRIPT_LENGTH = 20;
  if (trimmed.length < MIN_TRANSCRIPT_LENGTH) {
    return {
      valid: false,
      reason: 'The recording was too short. Please record at least a few sentences for the best results.',
    };
  }

  // Check minimum word count
  const MIN_TRANSCRIPT_WORDS = 5;
  const wordCount = trimmed.split(/\s+/).filter((word) => word.length > 0).length;
  if (wordCount < MIN_TRANSCRIPT_WORDS) {
    return {
      valid: false,
      reason: `Only ${wordCount} words were detected. Please speak more content for a meaningful blog post.`,
    };
  }

  return { valid: true };
}
