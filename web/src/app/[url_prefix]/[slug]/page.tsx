import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BlogHeader } from '@/components/blog/BlogHeader';
import { BlogControls } from '@/components/blog/BlogControls';
import { TableOfContentsWrapper } from '@/components/blog-post/TableOfContentsWrapper';
import { PostMeta } from '@/components/blog-post/PostMeta';
import { ArticleContent } from '@/components/blog-post/ArticleContent';
import { RelatedPosts } from '@/components/blog-post/RelatedPosts';
import { extractHeadings } from '@/lib/markdown-utils';
import type { BlogPost, Heading } from '@/types/blog-post';
import type { JournalWithAuthor } from '@/types/blog';
import 'react-syntax-highlighter/dist/esm/styles/prism';

interface PageProps {
  params: {
    url_prefix: string;
    slug: string;
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // First get the journal by url_prefix
  const { data: journal } = await supabase
    .from('journals')
    .select('id, display_name')
    .eq('url_prefix', params.url_prefix)
    .eq('is_active', true)
    .maybeSingle();

  if (!journal) {
    return { title: 'Journal Not Found' };
  }

  // Then get the post
  const { data: post } = await supabase
    .from('posts')
    .select('title, meta_description, content, published_at')
    .eq('slug', params.slug)
    .eq('journal_id', journal.id)
    .eq('status', 'published')
    .maybeSingle();

  if (!post) {
    return { title: 'Post Not Found' };
  }

  return {
    title: `${post.title} - ${journal.display_name || 'Blog'}`,
    description: post.meta_description || post.content?.slice(0, 160) || '',
    openGraph: {
      title: post.title,
      description: post.meta_description || post.content?.slice(0, 160) || '',
      type: 'article',
      publishedTime: post.published_at,
    },
  };
}

// Fetch data server-side
async function getPostData(urlPrefix: string, slug: string) {
  try {
    // First get the journal by url_prefix
    const { data: journal, error: journalError } = await supabase
      .from('journals')
      .select('*')
      .eq('url_prefix', urlPrefix)
      .eq('is_active', true)
      .maybeSingle();

    if (journalError || !journal) {
      console.error('Journal fetch error:', journalError);
      return null;
    }

    // Then get the post
    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .eq('journal_id', journal.id)
      .eq('status', 'published')
      .maybeSingle();

    if (error || !post) {
      console.error('Post fetch error:', error);
      return null;
    }

    // Combine the data
    const blogPost: BlogPost = {
      ...post,
      journals: {
        ...journal,
        user_profiles: journal.user_profiles || {
          full_name: null,
          avatar_url: null,
          bio: null,
        },
      },
    };

    return blogPost;
  } catch (error) {
    console.error('getPostData error:', error);
    return null;
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const post = await getPostData(params.url_prefix, params.slug);

  if (!post) {
    notFound();
  }

  const headings = extractHeadings(post.content || '');

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-neutral-900">
      <BlogHeader journal={post.journals as JournalWithAuthor} />

      <div className="sticky top-0 z-20">
        <BlogControls showFontSizeControls />
      </div>

      {/* Delight-themed gradient header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-accent/5 to-transparent" />
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4">
          <div className="h-96 w-96 rounded-full bg-gradient-to-br from-accent/20 to-transparent blur-3xl" />
        </div>
      </div>

      <main className="container-wide relative py-8">
        {/* Breadcrumb navigation */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <Link
            href={`/${params.url_prefix}`}
            className="inline-flex items-center gap-1 text-sm text-neutral-600 transition-colors hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent/50 dark:text-neutral-400"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>{post.journals.display_name}</span>
          </Link>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          {/* Main content */}
          <article className="min-w-0">
            <PostMeta post={post} urlPrefix={params.url_prefix} />
            <ArticleContent content={post.content || ''} />
            <RelatedPosts
              currentPostId={post.id}
              journalId={post.journal_id}
              urlPrefix={params.url_prefix}
            />
          </article>

          {/* TOC Sidebar */}
          <aside className="hidden lg:block">
            <TableOfContentsWrapper headings={headings} urlPrefix={params.url_prefix} />
          </aside>
        </div>

        {/* Mobile TOC */}
        <div className="lg:hidden mt-8">
          <TableOfContentsWrapper headings={headings} urlPrefix={params.url_prefix} />
        </div>
      </main>
    </div>
  );
}
