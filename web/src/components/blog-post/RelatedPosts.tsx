import { supabase } from '@/lib/supabase';
import type { RelatedPostsProps, BlogPost } from '@/types/blog-post';
import { PostCard } from '@/components/blog/PostCard';

import type { PostCardData } from '@/types/blog-post';

async function getRelatedPosts(journalId: string, currentPostId: string, limit = 4): Promise<PostCardData[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('journal_id', journalId)
    .eq('status', 'published')
    .neq('id', currentPostId)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map((post) => ({
    id: post.id,
    title: post.title || 'Untitled',
    slug: post.slug || '',
    excerpt: post.content ? post.content.slice(0, 150) + '...' : '',
    content: post.content || '',
    meta_description: post.meta_description,
    target_keyword: post.target_keyword,
    published_at: post.published_at || new Date().toISOString(),
    word_count: post.word_count || 0,
    reading_time_minutes: post.reading_time_minutes || 1,
    view_count: post.view_count || 0,
    audio_file_url: post.audio_file_url,
    audio_duration_seconds: post.audio_duration_seconds,
    style_used: post.style_used || 0,
  }));
}

export async function RelatedPosts({ currentPostId, journalId, urlPrefix }: RelatedPostsProps) {
  const relatedPosts = await getRelatedPosts(journalId, currentPostId);

  if (relatedPosts.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 border-t border-neutral-200 pt-8 dark:border-neutral-800">
      <h2 className="mb-6 text-2xl font-semibold text-neutral-900 dark:text-white">
        Related Posts
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {relatedPosts.map((post) => (
          <PostCard key={post.id} post={post} urlPrefix={urlPrefix} />
        ))}
      </div>
    </section>
  );
}
