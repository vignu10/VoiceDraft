import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Metadata } from 'next';
import Link from 'next/link';

interface PageProps {
  params: {
    url_prefix: string;
    slug: string;
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { data: journal } = await supabase
    .from('journals')
    .select('id')
    .eq('url_prefix', params.url_prefix)
    .eq('is_active', true)
    .maybeSingle();

  if (!journal) {
    return {
      title: 'Post Not Found',
    };
  }

  const { data: post } = await supabase
    .from('posts')
    .select('title, meta_description')
    .eq('journal_id', journal.id)
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: post.title || 'Blog Post',
    description: post.meta_description || undefined,
    openGraph: {
      title: post.title || 'Blog Post',
      description: post.meta_description || undefined,
      type: 'article',
    },
  };
}

// Fetch post data server-side
async function getPostData(urlPrefix: string, slug: string) {
  try {
    // First get the journal by url_prefix
    const { data: journal, error: journalError } = await supabase
      .from('journals')
      .select('id, display_name, url_prefix')
      .eq('url_prefix', urlPrefix)
      .eq('is_active', true)
      .maybeSingle();

    if (journalError || !journal) {
      console.error('Journal fetch error:', journalError);
      return null;
    }

    // Then get the post by slug within that journal
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('*')
      .eq('journal_id', journal.id)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (postError || !post) {
      console.error('Post fetch error:', postError);
      return null;
    }

    // Increment view count
    await supabase
      .from('posts')
      .update({ view_count: (post.view_count || 0) + 1 })
      .eq('id', post.id);

    return {
      post: { ...post, view_count: (post.view_count || 0) + 1 },
      journal,
    };
  } catch (error) {
    console.error('getPostData error:', error);
    return null;
  }
}

export default async function PostPage({ params }: PageProps) {
  const data = await getPostData(params.url_prefix, params.slug);

  if (!data) {
    notFound();
  }

  const { post, journal } = data;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="container-wide">
          <div className="flex items-center justify-between py-4">
            <Link
              href={`/${journal.url_prefix}`}
              className="text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              ← Back to {journal.display_name}
            </Link>
          </div>
        </div>
      </header>

      {/* Post Content */}
      <article className="container-wide py-12">
        <div className="mx-auto max-w-3xl">
          {/* Title */}
          <h1 className="mb-6 text-4xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-5xl">
            {post.title || 'Untitled'}
          </h1>

          {/* Metadata */}
          <div className="mb-8 flex flex-wrap items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
            <time dateTime={post.published_at}>
              {new Date(post.published_at || Date.now()).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            <span>·</span>
            <span>{post.word_count || 0} words</span>
            {post.reading_time_minutes && (
              <>
                <span>·</span>
                <span>{post.reading_time_minutes} min read</span>
              </>
            )}
            <span>·</span>
            <span>{post.view_count || 0} views</span>
          </div>

          {/* Tags */}
          {post.target_keyword && (
            <div className="mb-8">
              <span className="inline-block rounded-full bg-accent-light px-3 py-1 text-sm font-medium text-accent">
                {post.target_keyword}
              </span>
            </div>
          )}

          {/* Audio Player */}
          {post.audio_file_url && (
            <div className="mb-8 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <audio
                controls
                src={post.audio_file_url}
                className="w-full"
                preload="metadata"
              >
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          {/* Content */}
          <div
            className="blog-content"
            dangerouslySetInnerHTML={{ __html: post.content || '' }}
          />

          {/* Footer */}
          <footer className="mt-12 border-t border-neutral-200 pt-8 dark:border-neutral-800">
            <Link
              href={`/${journal.url_prefix}`}
              className="inline-flex items-center text-sm font-medium text-accent transition-colors hover:text-accent-hover"
            >
              ← Back to all posts
            </Link>
          </footer>
        </div>
      </article>
    </div>
  );
}
