import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import {
  listPosts,
  getPost,
  createPost,
  updatePost,
  deletePost as deletePostApi,
  publishPost as publishPostApi,
  unpublishPost as unpublishPostApi,
} from '@/services/api/posts';
import {
  getProfile,
  updateProfile as updateProfileApi,
} from '@/services/api/profiles';
import {
  getJournal as getJournalApi,
  createJournal as createJournalApi,
  updateJournal as updateJournalApi,
  updateStyles as updateStylesApi,
} from '@/services/api/journal';
import type { Draft } from '@/types/draft';
import type { UpdateProfileData } from '@/services/api/profiles';
import type { UpdateJournalData, Style } from '@/types/journal';
import { useAuthStore } from '@/stores';

// Query keys
export const queryKeys = {
  posts: (status: 'draft' | 'published' = 'draft') => ['posts', status] as const,
  post: (id: string) => ['post', id] as const,
  profile: ['profile'] as const,
  journal: ['journal'] as const,
} as const;

// ==================== POSTS HOOKS ====================

/**
 * Fetch all posts with optional status filter
 */
export function usePosts(status: 'draft' | 'published' = 'draft') {
  return useQuery({
    queryKey: queryKeys.posts(status),
    queryFn: async () => {
      const posts = await listPosts({ status });

      // Map Post to Draft format
      const mappedDrafts: Draft[] = posts.map(post => ({
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
        tone: 'professional',
        length: 'medium',
        isFavorite: false,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
        syncedAt: post.updated_at,
      }));

      return mappedDrafts;
    },
  });
}

/**
 * Fetch a single post by ID
 */
export function usePost(id: string) {
  return useQuery({
    queryKey: queryKeys.post(id),
    queryFn: () => getPost(id),
    enabled: !!id,
  });
}

/**
 * Create a new post
 */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { title: string; content?: string; transcript?: string; target_keyword?: string; tone?: 'professional' | 'casual' | 'conversational'; length?: 'short' | 'medium' | 'long' }) => {
      return await createPost(data);
    },
    onSuccess: () => {
      // Invalidate posts queries to refetch
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error: unknown) => {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create post');
    },
  });
}

/**
 * Update a post
 */
export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data?: { title?: string; content?: string; meta_description?: string; target_keyword?: string; transcript?: string } }) => {
      return await updatePost(id, data || {});
    },
    onSuccess: (_: unknown, variables: { id: string; data?: { title?: string; content?: string; meta_description?: string; target_keyword?: string; transcript?: string } | undefined }) => {
      // Invalidate the specific post and the posts list
      queryClient.invalidateQueries({ queryKey: queryKeys.post(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error: unknown) => {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update post');
    },
  });
}

/**
 * Delete a post
 */
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await deletePostApi(id);
      return id;
    },
    onSuccess: () => {
      // Invalidate posts queries
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error: unknown) => {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete post');
    },
  });
}

/**
 * Publish a post
 */
export function usePublishPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await publishPostApi(id);
    },
    onSuccess: () => {
      // Invalidate both draft and published posts
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error: unknown) => {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to publish post');
    },
  });
}

/**
 * Unpublish a post
 */
export function useUnpublishPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await unpublishPostApi(id);
    },
    onSuccess: () => {
      // Invalidate both draft and published posts
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error: unknown) => {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to unpublish post');
    },
  });
}

// ==================== PROFILE HOOKS ====================

/**
 * Fetch user profile
 */
export function useProfile() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: getProfile,
    retry: false,
    enabled: isAuthenticated, // Only run when authenticated
  });
}

/**
 * Update user profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileData) => updateProfileApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    },
    onError: (error: unknown) => {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update profile');
    },
  });
}

// ==================== JOURNAL HOOKS ====================

/**
 * Fetch user's journal
 */
export function useJournal() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.journal,
    queryFn: getJournalApi,
    retry: false,
    enabled: isAuthenticated, // Only run when authenticated
  });
}

/**
 * Create a new journal
 */
export function useCreateJournal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data?: { display_name?: string; description?: string }) => {
      return await createJournalApi(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.journal });
    },
    onError: (error: unknown) => {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create journal');
    },
  });
}

/**
 * Update journal
 */
export function useUpdateJournal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateJournalData) => updateJournalApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.journal });
    },
    onError: (error: unknown) => {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update journal');
    },
  });
}

/**
 * Update journal styles
 */
export function useUpdateStyles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (styles: Style[]) => updateStylesApi(styles),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.journal });
    },
    onError: (error: unknown) => {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update styles');
    },
  });
}

/**
 * Ensure journal exists (create if not)
 */
export function useEnsureJournal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const journal = await getJournalApi();
      if (!journal) {
        return await createJournalApi();
      }
      return journal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.journal });
    },
  });
}
