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
    .select('display_name, description, user_profiles!inner(full_name, avatar_url)')
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
  const { data: journal, error } = await supabase
    .from('journals')
    .select(
      `
      *,
      user_profiles!inner (
        full_name,
        avatar_url,
        bio
      )
    `
    )
    .eq('url_prefix', urlPrefix)
    .eq('is_active', true)
    .single();

  if (error || !journal) {
    return null;
  }

  // Fetch initial posts
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('journal_id', journal.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(12);

  const postsWithExcerpts = (posts || []).map((post) => ({
    ...post,
    excerpt: post.content ? post.content.slice(0, 150) + (post.content.length > 150 ? '...' : '') : '',
  }));

  return {
    journal,
    posts: postsWithExcerpts,
    total: posts?.length || 0,
  };
}

export default async function BlogPage({ params }: PageProps) {
  const data = await getJournalData(params.url_prefix);

  if (!data) {
    notFound();
  }

  const { journal, posts, total } = data;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <BlogHeader journal={journal as JournalWithAuthor} />

      <div className="sticky top-0 z-20">
        <BlogControls
          onSearchChange={(search) => {
            // Handled by PostCardGrid via window.__blogFetch
            if (typeof window !== 'undefined' && (window as any).__blogFetch) {
              (window as any).__blogFetch(search, 'newest');
            }
          }}
          onSortChange={(sort) => {
            if (typeof window !== 'undefined' && (window as any).__blogFetch) {
              (window as any).__blogFetch('', sort);
            }
          }}
        />
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PostCardGrid
          initialPosts={posts as PostCardData[]}
          urlPrefix={params.url_prefix}
          total={total}
        />
      </main>
    </div>
  );
}
