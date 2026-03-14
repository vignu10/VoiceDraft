// Blog listing page types

export interface JournalWithAuthor {
  id: string;
  url_prefix: string;
  display_name: string;
  description: string | null;
  created_at: string;
  user_profiles: {
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
  };
}

export interface PostCardData {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  meta_description: string | null;
  target_keyword: string | null;
  published_at: string;
  word_count: number;
  reading_time_minutes: number;
  view_count: number;
  audio_file_url: string | null;
  audio_duration_seconds: number | null;
  style_used: number;
}

export interface PostsResponse {
  posts: PostCardData[];
  total: number;
  hasMore: boolean;
  limit: number;
  offset: number;
}

export type SortOption = 'newest' | 'oldest' | 'title';

export interface BlogFilters {
  search: string;
  sort: SortOption;
}

// Re-export blog post types for convenience
export type { BlogPost, Heading, TableOfContentsProps, MarkdownRendererProps, PostMetaProps, RelatedPostsProps } from './blog-post';
