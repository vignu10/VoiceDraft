import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { handleError } from '@/lib/auth-helpers';
import type { DiscoveryResponse } from '@/types/discover';

// GET featured blogs and recent posts for discovery hub
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const blogsLimit = parseInt(searchParams.get('blogsLimit') || '12');
    const blogsOffset = parseInt(searchParams.get('blogsOffset') || '0');
    const postsLimit = parseInt(searchParams.get('postsLimit') || '12');
    const postsOffset = parseInt(searchParams.get('postsOffset') || '0');
    const sort = searchParams.get('sort') || 'newest';

    // Fetch featured blogs with post counts and latest post
    let blogsQuery = supabase
      .from('journals')
      .select(`
        id,
        url_prefix,
        display_name,
        description,
        created_at,
        user_profiles (
          full_name,
          avatar_url
        ),
        posts (
          id,
          title,
          slug,
          published_at
        )
      `, { count: 'exact' })
      .eq('is_active', true);

    // Add sorting for blogs
    switch (sort) {
      case 'active':
        // Sort by most recent activity (latest post)
        blogsQuery = blogsQuery.order('updated_at', { ascending: false });
        break;
      case 'posts':
        // Sort by post count (handled post-query for now)
        break;
      case 'newest':
      default:
        blogsQuery = blogsQuery.order('created_at', { ascending: false });
        break;
    }

    // Add pagination for blogs
    const blogsFrom = blogsOffset;
    const blogsTo = blogsOffset + blogsLimit - 1;
    blogsQuery = blogsQuery.range(blogsFrom, blogsTo);

    const { data: journals, error: journalsError, count: journalsCount } = await blogsQuery;

    if (journalsError) {
      return handleError(journalsError);
    }

    // Transform journals into blog discovery cards
    const blogs = (journals || []).map((journal: any) => {
      const posts = journal.posts || [];
      const latestPost = posts.length > 0
        ? posts.sort((a: any, b: any) =>
            new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
          )[0]
        : null;

      return {
        id: journal.id,
        url_prefix: journal.url_prefix,
        display_name: journal.display_name,
        description: journal.description,
        created_at: journal.created_at,
        post_count: posts.length,
        latest_post: latestPost ? {
          id: latestPost.id,
          title: latestPost.title,
          slug: latestPost.slug,
          published_at: latestPost.published_at,
        } : null,
        user_profiles: journal.user_profiles || {
          full_name: null,
          avatar_url: null,
        },
      };
    });

    // Sort by post count if requested
    if (sort === 'posts') {
      blogs.sort((a: any, b: any) => b.post_count - a.post_count);
    }

    // Fetch recent posts across all blogs
    const { data: posts, error: postsError, count: postsCount } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        slug,
        content,
        excerpt,
        meta_description,
        target_keyword,
        published_at,
        word_count,
        reading_time_minutes,
        view_count,
        audio_file_url,
        audio_duration_seconds,
        style_used,
        journals (
          url_prefix
        )
      `, { count: 'exact' })
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(postsOffset, postsOffset + postsLimit - 1);

    if (postsError) {
      return handleError(postsError);
    }

    // Transform posts to include url_prefix
    const postsWithPrefix = (posts || []).map((post: any) => ({
      ...post,
      url_prefix: post.journals?.url_prefix || '',
    }));

    const response: DiscoveryResponse = {
      blogs,
      posts: postsWithPrefix,
      blogsTotal: journalsCount || 0,
      postsTotal: postsCount || 0,
      hasMoreBlogs: (journalsCount || 0) > blogsOffset + blogsLimit,
      hasMorePosts: (postsCount || 0) > postsOffset + postsLimit,
    };

    return NextResponse.json(response);
  } catch (error) {
    return handleError(error);
  }
}
