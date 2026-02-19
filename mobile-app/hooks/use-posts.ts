import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createPost, deletePost, updatePost, publishPost, unpublishPost, listPosts, getPost, type CreatePostData, type UpdatePostData } from '@/services/api/posts';
import type { Post } from '@/types/draft';

// Query keys factory for posts
export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (status: string) => [...postKeys.lists(), status] as const,
  details: () => [...postKeys.all, 'detail'] as const,
  detail: (id: string) => [...postKeys.details(), id] as const,
};

/**
 * Hook to fetch posts with optional status filter
 */
export function usePosts(status: 'draft' | 'published' = 'draft') {
  return useQuery({
    queryKey: postKeys.list(status),
    queryFn: () => listPosts({ status }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch a single post by ID
 */
export function usePost(id: string) {
  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: () => getPost(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to create a new post
 */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation<Post, Error, CreatePostData>({
    mutationFn: createPost,
    onSuccess: (newPost: Post) => {
      // Invalidate the posts list to refetch
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });

      // Add the new post to the cache
      queryClient.setQueryData(postKeys.detail(newPost.id), newPost);
    },
  });
}

/**
 * Hook to update a post
 */
export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation<Post, Error, { id: string; data: UpdatePostData }>({
    mutationFn: ({ id, data }: { id: string; data: UpdatePostData }) => updatePost(id, data),
    onSuccess: (updatedPost: Post) => {
      // Update the specific post in cache
      queryClient.setQueryData(postKeys.detail(updatedPost.id), updatedPost);

      // Invalidate the posts list to refetch
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
}

/**
 * Hook to delete a post
 */
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deletePost,
    onSuccess: (_: unknown, deletedId: string) => {
      // Remove the post from cache
      queryClient.removeQueries({ queryKey: postKeys.detail(deletedId) });

      // Invalidate the posts list to refetch
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
}

/**
 * Hook to publish a post
 */
export function usePublishPost() {
  const queryClient = useQueryClient();

  return useMutation<Post, Error, string>({
    mutationFn: publishPost,
    onSuccess: (publishedPost) => {
      // Update the post in cache
      queryClient.setQueryData(postKeys.detail(publishedPost.id), publishedPost);

      // Invalidate both lists since status changed
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
}

/**
 * Hook to unpublish a post
 */
export function useUnpublishPost() {
  const queryClient = useQueryClient();

  return useMutation<Post, Error, string>({
    mutationFn: unpublishPost,
    onSuccess: (unpublishedPost) => {
      // Update the post in cache
      queryClient.setQueryData(postKeys.detail(unpublishedPost.id), unpublishedPost);

      // Invalidate both lists since status changed
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
}
