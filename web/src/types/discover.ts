// Discovery hub types

import type { PostCardData } from './blog';

export interface BlogDiscoveryCard {
  id: string;
  url_prefix: string;
  display_name: string;
  description: string | null;
  created_at: string;
  post_count: number;
  latest_post: {
    id: string;
    title: string;
    slug: string;
    published_at: string;
  } | null;
  user_profiles: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface DiscoveryResponse {
  blogs: BlogDiscoveryCard[];
  posts: PostCardData[];
  blogsTotal: number;
  postsTotal: number;
  hasMoreBlogs: boolean;
  hasMorePosts: boolean;
}

export type DiscoverySort = 'newest' | 'active' | 'posts';
