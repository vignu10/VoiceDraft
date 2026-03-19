import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { handleError } from '@/lib/auth-helpers';
import type { DiscoveryResponse, BlogDiscoveryCard, DiscoverySort, PostWithPrefix } from '@/types/discover';

// GET featured blogs and recent posts for discovery hub
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const blogsLimit = parseInt(searchParams.get('blogsLimit') || '12');
    const blogsOffset = parseInt(searchParams.get('blogsOffset') || '0');
    const postsLimit = parseInt(searchParams.get('postsLimit') || '12');
    const postsOffset = parseInt(searchParams.get('postsOffset') || '0');
    const sort = searchParams.get('sort') || 'newest';

    // Validate query parameters
    const VALID_SORTS: DiscoverySort[] = ['newest', 'active', 'posts'];
    const validSort = VALID_SORTS.includes(sort as DiscoverySort) ? sort as DiscoverySort : 'newest';

    if (isNaN(blogsLimit) || blogsLimit < 1 || blogsLimit > 100) {
      return NextResponse.json(
        { error: 'blogsLimit must be between 1 and 100' },
        { status: 400 }
      );
    }

    if (isNaN(blogsOffset) || blogsOffset < 0) {
      return NextResponse.json(
        { error: 'blogsOffset must be >= 0' },
        { status: 400 }
      );
    }

    if (isNaN(postsLimit) || postsLimit < 1 || postsLimit > 100) {
      return NextResponse.json(
        { error: 'postsLimit must be between 1 and 100' },
        { status: 400 }
      );
    }

    if (isNaN(postsOffset) || postsOffset < 0) {
      return NextResponse.json(
        { error: 'postsOffset must be >= 0' },
        { status: 400 }
      );
    }

    // Fetch featured blogs with post counts and latest post
    let blogsQuery = supabase
      .from('journals')
      .select(`
        id,
        url_prefix,
        display_name,
        description,
        created_at,
        posts (
          id,
          title,
          slug,
          published_at
        )
      `, { count: 'exact' })
      .eq('is_active', true);

    // Add sorting for blogs
    switch (validSort) {
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
    const blogs: BlogDiscoveryCard[] = (journals || []).map((journal: any) => {
      const posts = Array.isArray(journal.posts) ? journal.posts : [];

      const latestPost = posts.length > 0
        ? posts.sort((a: { published_at: string }, b: { published_at: string }) =>
            new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
          )[0]
        : null;

      return {
        id: journal.id,
        url_prefix: journal.url_prefix,
        display_name: journal.display_name || 'Untitled Blog',
        description: journal.description,
        created_at: journal.created_at,
        post_count: posts.length,
        latest_post: latestPost ? {
          id: latestPost.id,
          title: latestPost.title || 'Untitled',
          slug: latestPost.slug || '',
          published_at: latestPost.published_at,
        } : null,
        user_profiles: {
          full_name: null,
          avatar_url: null,
        },
      };
    });

    // Sort by post count if requested
    if (validSort === 'posts') {
      blogs.sort((a: BlogDiscoveryCard, b: BlogDiscoveryCard) => b.post_count - a.post_count);
    }

    // Fetch recent published posts across all blogs with journal info
    // Accept posts where status='published' (backfill published_at if null)
    const { data: posts, error: postsError, count: postsCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range(postsOffset, postsOffset + postsLimit - 1);

    if (postsError) {
      return handleError(postsError);
    }

    // Get journal URL prefixes for posts
    const journalIds = [...new Set(posts?.map(p => p.journal_id) || [])];
    const { data: journalsForPosts } = await supabase
      .from('journals')
      .select('id, url_prefix')
      .in('id', journalIds);

    const journalMap = new Map(journalsForPosts?.map(j => [j.id, j.url_prefix]) || []);

    // Transform posts to include url_prefix and generate excerpts
    const postsWithPrefix: PostWithPrefix[] = (posts || []).map((post) => ({
      ...post,
      url_prefix: journalMap.get(post.journal_id) || '',
      excerpt: post.content ? post.content.slice(0, 150) + (post.content.length > 150 ? '...' : '') : '',
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
