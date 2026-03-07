export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  meta_description: string | null;
  target_keyword: string | null;
  published_at: string;
  word_count: number;
  reading_time_minutes: number;
  view_count: number;
  audio_file_url: string | null;
  audio_duration_seconds: number | null;
  journal_id: string;
  journals: {
    id: string;
    display_name: string;
    url_prefix: string;
    user_profiles: {
      full_name: string | null;
      avatar_url: string | null;
      bio: string | null;
    } | null;
  };
}

export interface Heading {
  id: string;
  text: string;
  level: number;
}

export interface TableOfContentsProps {
  headings: Heading[];
  activeId: string;
  urlPrefix: string;
}

export interface MarkdownRendererProps {
  content: string;
}

export interface PostMetaProps {
  post: BlogPost;
  urlPrefix: string;
}

export interface RelatedPostsProps {
  currentPostId: string;
  journalId: string;
  urlPrefix: string;
}
