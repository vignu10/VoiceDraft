import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BlogHeader } from '@/components/blog/BlogHeader';
import { TableOfContentsWrapper } from '@/components/blog-post/TableOfContentsWrapper';
import { PostMeta } from '@/components/blog-post/PostMeta';
import { MarkdownRenderer } from '@/components/blog-post/MarkdownRenderer';
import { extractHeadings } from '@/lib/markdown-utils';
import type { BlogPost, Heading } from '@/types/blog-post';
import type { JournalWithAuthor } from '@/types/blog';
import 'react-syntax-highlighter/dist/esm/styles/prism';

// Strip the title from the content if it appears as an h1 at the start
function stripTitleFromContent(content: string, title: string): string {
  if (!content || !title) return content;

  // Remove h1 heading that matches the title (with or without #)
  const titleVariants = [
    `# ${title}`,
    `# ${title.replace(/[#*_\[\]]/g, '\\$&')}`, // Escape special markdown chars
  ];

  let cleanedContent = content;
  for (const variant of titleVariants) {
    const regex = new RegExp(`^${escapeRegExp(variant)}\\s*\\n`, 'im');
    cleanedContent = cleanedContent.replace(regex, '');
  }

  return cleanedContent.trim();
}

// Helper to escape regex special characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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

  // Strip title from content to avoid duplication
  const contentWithoutTitle = stripTitleFromContent(post.content || '', post.title || '');

  const headings = extractHeadings(contentWithoutTitle);

  return (
    <div className="min-h-screen">
      <BlogHeader journal={post.journals as JournalWithAuthor} />

      {/* Bold-themed gradient header with decorative elements */}
      <div className="relative overflow-hidden border-b border-neutral-200/50 dark:border-neutral-800/50">
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-200/30 via-neutral-100/20 to-transparent dark:from-neutral-800/30 dark:via-neutral-700/20" />
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4">
          <div className="h-96 w-96 rounded-full bg-gradient-to-br from-neutral-300/20 to-transparent blur-3xl dark:from-neutral-700/20" />
        </div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4">
          <div className="h-64 w-64 rounded-full bg-gradient-to-tr from-neutral-200/15 to-transparent blur-3xl dark:from-neutral-800/15" />
        </div>
      </div>

      <main className="container-wide relative py-8">
        {/* Bold breadcrumb navigation */}
        <nav className="mb-8" aria-label="Breadcrumb">
          <Link
            href={`/${params.url_prefix}`}
            className="group inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 transition-colors hover:text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 rounded-lg dark:text-neutral-400"
          >
            <svg className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to {post.journals.display_name}</span>
          </Link>
        </nav>

        <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
          {/* Main content */}
          <article className="min-w-0">
            <PostMeta post={post} urlPrefix={params.url_prefix} />
            <div className="blog-content max-w-none">
              <MarkdownRenderer content={contentWithoutTitle} />
            </div>
          </article>

          {/* TOC Sidebar */}
          <aside className="hidden lg:block">
            <TableOfContentsWrapper headings={headings} urlPrefix={params.url_prefix} />
          </aside>
        </div>

        {/* Mobile TOC */}
        <div className="lg:hidden mt-12">
          <TableOfContentsWrapper headings={headings} urlPrefix={params.url_prefix} />
        </div>
      </main>
    </div>
  );
}
