import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Metadata } from 'next';
import { BlogHeader } from '@/components/blog/BlogHeader';
import { BlogControls } from '@/components/blog/BlogControls';
import { PostCardGrid } from '@/components/blog/PostCardGrid';
import type { JournalWithAuthor, PostCardData } from '@/types/blog';

interface PageProps {
  params: {
    url_prefix: string;
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { data: journal } = await supabase
    .from('journals')
    .select('display_name, description')
    .eq('url_prefix', params.url_prefix)
    .eq('is_active', true)
    .single();

  if (!journal) {
    return {
      title: 'Journal Not Found',
    };
  }

  return {
    title: `${journal.display_name} - Blog`,
    description: journal.description || `Read ${journal.display_name}'s latest blog posts`,
    openGraph: {
      title: journal.display_name,
      description: journal.description || '',
      type: 'website',
    },
  };
}

// Fetch data server-side
async function getJournalData(urlPrefix: string) {
  try {
    // Fetch journal without user profile join (no FK relationship exists)
    const { data: journal, error: journalError } = await supabase
      .from('journals')
      .select('*')
      .eq('url_prefix', urlPrefix)
      .eq('is_active', true)
      .single();

    if (journalError || !journal) {
      console.error('Journal fetch error:', journalError);
      return null;
    }

    // Fetch initial posts - must have BOTH status='published' AND published_at IS NOT NULL
    const { data: posts, error: postsError, count } = await supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .eq('journal_id', journal.id)
      .eq('status', 'published')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .limit(12);

    if (postsError) {
      console.error('Posts fetch error:', postsError);
    }

    // Safely map posts with default values for all fields
    const postsWithExcerpts = (posts || []).map((post) => ({
      id: post.id,
      title: post.title || 'Untitled',
      slug: post.slug || '',
      excerpt: post.content ? post.content.slice(0, 150) + (post.content.length > 150 ? '...' : '') : '',
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

    return {
      journal: {
        ...journal,
        user_profiles: {
          full_name: null,
          avatar_url: null,
          bio: null,
        },
      },
      posts: postsWithExcerpts,
      total: count || 0,
    };
  } catch (error) {
    console.error('getJournalData error:', error);
    return null;
  }
}

export default async function BlogPage({ params }: PageProps) {
  const data = await getJournalData(params.url_prefix);

  if (!data) {
    notFound();
  }

  const { journal, posts, total } = data;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <BlogHeader journal={journal as JournalWithAuthor} />

      <div className="sticky top-0 z-20">
        <BlogControls />
      </div>

      <main className="container-wide py-12">
        <PostCardGrid
          initialPosts={posts as PostCardData[]}
          urlPrefix={params.url_prefix}
          total={total}
        />
      </main>
    </div>
  );
}
