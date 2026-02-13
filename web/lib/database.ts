// ============================================================================
// Database Utility Functions
// ============================================================================

import { supabase } from './config';
import type { UserProfile, Journal, Post, PostFilters } from './types';

// ============================================================================
// User Profiles
// ============================================================================

/**
 * Get current user's profile
 */
export const getUserProfile = async (authUserId: string): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single();

  if (error) throw error;
  return data as UserProfile;
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  authUserId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile[]> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('auth_user_id', authUserId)
    .select();

  if (error) throw error;
  return data as UserProfile[];
};

// ============================================================================
// Journals
// ============================================================================

/**
 * Get current user's journal
 */
export const getUserJournal = async (authUserId: string): Promise<Journal> => {
  const { data, error } = await supabase
    .from('journals')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single();

  if (error) throw error;
  return data as Journal;
};

/**
 * Get journal by URL prefix (public)
 */
export const getJournalByUrlPrefix = async (urlPrefix: string): Promise<Journal | null> => {
  const { data, error } = await supabase
    .from('journals')
    .select('*')
    .eq('url_prefix', urlPrefix)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data as Journal | null;
};

/**
 * Update journal
 */
export const updateJournal = async (
  journalId: string,
  updates: Partial<Journal>
): Promise<Journal | null> => {
  const { data, error } = await supabase
    .from('journals')
    .update(updates)
    .eq('id', journalId)
    .select()
    .single();

  if (error) throw error;
  return data as Journal | null;
};

// ============================================================================
// Posts
// ============================================================================

/**
 * Get user's posts (all statuses)
 */
export const getUserPosts = async (journalId: string, filters: PostFilters = {}): Promise<Post[]> => {
  let query = supabase
    .from('posts')
    .select('*')
    .eq('journal_id', journalId);

  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.audioUnprocessed) {
    query = query.eq('audio_is_processed', false);
  }
  if (filters.limit) {
    query = query.limit(filters.limit);
  }
  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit ?? 10) - 1);
  }

  // Order by updated_at desc
  query = query.order('updated_at', { ascending: false });

  const { data, error } = await query;

  if (error) throw error;
  return data as Post[];
};

/**
 * Get single post by ID
 */
export const getPostById = async (postId: string): Promise<Post> => {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (error) throw error;
  return data as Post;
};

/**
 * Get published post by journal URL prefix and slug (public)
 */
export const getPublishedPost = async (
  urlPrefix: string,
  slug: string
): Promise<Post | null> => {
  // First get the journal ID from url_prefix
  const { data: journal, error: journalError } = await supabase
    .from('journals')
    .select('id')
    .eq('url_prefix', urlPrefix)
    .eq('is_active', true)
    .single();

  if (journalError) {
    if (journalError.code === 'PGRST116') return null;
    throw journalError;
  }
  if (!journal) return null;

  // Then get the published post
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('journal_id', journal.id)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as Post | null;
};

/**
 * Get published posts for a journal (public)
 */
export const getJournalPublishedPosts = async (urlPrefix: string): Promise<Post[]> => {
  // First get the journal ID from url_prefix
  const { data: journal, error: journalError } = await supabase
    .from('journals')
    .select('id')
    .eq('url_prefix', urlPrefix)
    .eq('is_active', true)
    .single();

  if (journalError) {
    if (journalError.code === 'PGRST116') return [];
    throw journalError;
  }
  if (!journal) return [];

  // Then get the published posts
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('journal_id', journal.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) throw error;
  return data as Post[];
};

/**
 * Get posts with unprocessed audio
 */
export const getUnprocessedAudioPosts = async (): Promise<Post[]> => {
  const { data, error } = await supabase
    .from('posts')
    .select('id, audio_s3_key, audio_file_url, audio_duration_seconds, audio_format, created_at')
    .eq('audio_is_processed', false)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as Post[];
};

/**
 * Create a new post
 */
export const createPost = async (postData: {
  journalId: string;
  title: string;
  slug: string;
  content: string;
  metaDescription?: string;
  targetKeyword?: string;
  audioS3Key: string;
  audioFileUrl: string;
  audioFileSizeBytes?: number;
  audioDurationSeconds?: number;
  audioFormat?: string;
  audioMimeType?: string;
  styleUsed?: number;
}): Promise<Post> => {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      journal_id: postData.journalId,
      title: postData.title,
      slug: postData.slug,
      content: postData.content,
      meta_description: postData.metaDescription ?? null,
      target_keyword: postData.targetKeyword ?? null,
      status: 'draft',
      word_count: 0,
      reading_time_minutes: 0,
      view_count: 0,
      audio_s3_key: postData.audioS3Key,
      audio_file_url: postData.audioFileUrl,
      audio_file_size_bytes: postData.audioFileSizeBytes ?? null,
      audio_duration_seconds: postData.audioDurationSeconds ?? null,
      audio_format: postData.audioFormat ?? null,
      audio_mime_type: postData.audioMimeType ?? null,
      audio_is_processed: false,
      style_used: postData.styleUsed ?? null,
      processing_meta: {},
    })
    .select()
    .single();

  if (error) throw error;
  return data as Post;
};

/**
 * Update a post
 */
export const updatePost = async (
  postId: string,
  updates: Partial<Post>
): Promise<Post | null> => {
  const { data, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', postId)
    .select()
    .single();

  if (error) throw error;
  return data as Post | null;
};

/**
 * Update post transcript
 */
export const updatePostTranscript = async (
  postId: string,
  transcript: string
): Promise<Post | null> => {
  const { data, error } = await supabase
    .from('posts')
    .update({
      transcript,
      audio_is_processed: true,
    })
    .eq('id', postId)
    .select()
    .single();

  if (error) throw error;
  return data as Post | null;
};

/**
 * Publish a post
 */
export const publishPost = async (postId: string): Promise<Post | null> => {
  const { data, error } = await supabase
    .from('posts')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
    })
    .eq('id', postId)
    .select()
    .single();

  if (error) throw error;
  return data as Post | null;
};

/**
 * Unpublish a post
 */
export const unpublishPost = async (postId: string): Promise<Post | null> => {
  const { data, error } = await supabase
    .from('posts')
    .update({
      status: 'draft',
      published_at: null,
    })
    .eq('id', postId)
    .select()
    .single();

  if (error) throw error;
  return data as Post | null;
};

/**
 * Delete a post
 */
export const deletePost = async (postId: string): Promise<void> => {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);

  if (error) throw error;
};

// ============================================================================
// Slug Utility
// ============================================================================

/**
 * Generate a unique slug for a journal
 */
export const generateSlug = async (
  journalId: string,
  title: string,
  existingSlugs: string[] = []
): Promise<string> => {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100);

  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

/**
 * Check if slug is unique for a journal
 */
export const isSlugUnique = async (
  journalId: string,
  slug: string
): Promise<boolean> => {
  const { data, error } = await supabase
    .from('posts')
    .select('id')
    .eq('journal_id', journalId)
    .eq('slug', slug);

  if (error) throw error;
  return data.length === 0; // Empty array means slug is unique
};
