import { apiClient } from './client';
import { ensureJournalExists } from './journal';
import type { Post } from '@/types/draft';

export interface ListPostsOptions {
  status?: 'draft' | 'published';
}

export interface CreatePostData {
  title: string;
  content?: string;
  meta_description?: string;
  transcript?: string;
  target_keyword?: string;
  tone?: 'professional' | 'casual' | 'conversational';
  length?: 'short' | 'medium' | 'long';
}

export interface UpdatePostData {
  title?: string;
  content?: string;
  meta_description?: string;
  target_keyword?: string;
  transcript?: string;
}

export async function listPosts(options: ListPostsOptions = {}): Promise<Post[]> {
  const status = options.status || 'draft';
  const response = await apiClient.get<Post[]>(`/api/posts?status=${status}`);

  // Handle session expired - auth failed callback will trigger logout and redirect
  if (!response.success && response.error === 'Session expired. Please sign in again.') {
    return [];
  }

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch posts');
  }

  return response.data;
}

export async function getPost(id: string): Promise<Post> {
  const response = await apiClient.get<Post>(`/api/posts/${id}`);

  // Handle session expired - auth failed callback will trigger logout and redirect
  if (!response.success && response.error === 'Session expired. Please sign in again.') {
    throw new Error('Session expired');
  }

  if (!response.success || !response.data) {
    // Provide specific error for 404/not found
    if (response.error?.includes('not found') || response.error?.includes('forbidden')) {
      throw new Error('This draft does not exist or you do not have permission to view it.');
    }
    throw new Error(response.error || 'Failed to fetch post');
  }

  return response.data;
}

export async function createPost(data: CreatePostData): Promise<Post> {
  // Ensure a journal exists before creating a post
  await ensureJournalExists();

  // Map tone and length to style_used index
  const styleUsed = getStyleIndex(data.tone || 'professional', data.length || 'medium');

  const response = await apiClient.post<Post>('/api/posts', {
    title: data.title,
    content: data.content || '',
    meta_description: data.meta_description,
    transcript: data.transcript,
    target_keyword: data.target_keyword,
    style_used: styleUsed,
    word_count: undefined, // Let backend calculate
  });

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to create post');
  }

  return response.data;
}

export async function updatePost(id: string, data: UpdatePostData): Promise<Post> {
  const response = await apiClient.put<Post>(`/api/posts/${id}`, {
    title: data.title,
    content: data.content,
    meta_description: data.meta_description,
    target_keyword: data.target_keyword,
    transcript: data.transcript,
  });

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to update post');
  }

  return response.data;
}

export async function deletePost(id: string): Promise<void> {
  const response = await apiClient.delete(`/api/posts/${id}`);

  if (!response.success) {
    throw new Error(response.error || 'Failed to delete post');
  }
}

export async function publishPost(id: string): Promise<Post> {
  const response = await apiClient.post<Post>(`/api/posts/${id}/publish`, {});

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to publish post');
  }

  return response.data;
}

export async function unpublishPost(id: string): Promise<Post> {
  const response = await apiClient.post<Post>(`/api/posts/${id}/unpublish`, {});

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to unpublish post');
  }

  return response.data;
}

export async function updateTranscript(id: string, transcript: string): Promise<Post> {
  const response = await apiClient.patch<Post>(`/api/posts/${id}/transcript`, { transcript });

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to update transcript');
  }

  return response.data;
}

// Helper function to map tone/length to style index
function getStyleIndex(
  tone: 'professional' | 'casual' | 'conversational',
  length: 'short' | 'medium' | 'long'
): 0 | 1 | 2 {
  // This is a simplified mapping - adjust based on your style definitions
  if (tone === 'professional') return 0;
  if (tone === 'casual') return 1;
  return 2; // technical/conversational
}
