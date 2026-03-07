import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Metadata } from 'next';
import { BlogHeader } from '@/components/blog/BlogHeader';
import { BlogControls } from '@/components/blog/BlogControls';
import { MarkdownRenderer } from '@/components/blog-post/MarkdownRenderer';
import { TableOfContents, useActiveHeading } from '@/components/blog-post/TableOfContents';
import { PostMeta } from '@/components/blog-post/PostMeta';
import { RelatedPosts } from '@/components/blog-post/RelatedPosts';
import { extractHeadings } from '@/lib/markdown-utils';
import type { BlogPost, Heading } from '@/types/blog-post';
import 'react-syntax-highlighter/dist/esm/styles/prism';

interface PageProps {
  params: {
    url_prefix: string;
    slug: string;
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { data: post } = await supabase
    .from('posts')
    .select(`
      *,
      journals (
        display_name,
        url_prefix
      )
    `)
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: `${post.title} - ${post.journals?.display_name || 'Blog'}`,
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
    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        journals (
          *,
          user_profiles (
            full_name,
            avatar_url,
            bio
          )
        )
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error || !post) {
      console.error('Post fetch error:', error);
      return null;
    }

    // Verify URL prefix matches
    if (post.journals?.url_prefix !== urlPrefix) {
      return null;
    }

    return post as BlogPost;
  } catch (error) {
    console.error('getPostData error:', error);
    return null;
  }
}

// Active heading wrapper component
function TableOfContentsWrapper({ headings, urlPrefix }: { headings: Heading[]; urlPrefix: string }) {
  const activeId = useActiveHeading(headings);
  return <TableOfContents headings={headings} activeId={activeId} urlPrefix={urlPrefix} />;
}

export default async function BlogPostPage({ params }: PageProps) {
  const post = await getPostData(params.url_prefix, params.slug);

  if (!post) {
    notFound();
  }

  const headings = extractHeadings(post.content || '');

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <BlogHeader journal={post.journals} />

      <div className="sticky top-0 z-20">
        <BlogControls />
      </div>

      <main className="container-wide py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          {/* Main content */}
          <article className="min-w-0">
            <PostMeta post={post} urlPrefix={params.url_prefix} />
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <MarkdownRenderer content={post.content || ''} />
            </div>
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
