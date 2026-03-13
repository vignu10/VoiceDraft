import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { handleError } from '@/lib/auth-helpers';

interface PostsResponse {
  posts: Array<{
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    meta_description: string | null;
    target_keyword: string | null;
    published_at: string;
    word_count: number;
    reading_time_minutes: number;
    view_count: number;
    audio_file_url: string | null;
    audio_duration_seconds: number | null;
    style_used: number;
  }>;
  total: number;
  hasMore: boolean;
  limit: number;
  offset: number;
}

// GET published posts for a journal with pagination, sorting, and search
export async function GET(
  req: NextRequest,
  { params }: { params: { url_prefix: string } }
) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sort = searchParams.get('sort') || 'newest';
    const search = searchParams.get('search') || '';

    // First get the journal by url_prefix
    const { data: journal, error: journalError } = await supabase
      .from('journals')
      .select('id')
      .eq('url_prefix', params.url_prefix)
      .eq('is_active', true)
      .maybeSingle();

    if (journalError || !journal) {
      return NextResponse.json({ error: 'Journal not found' }, { status: 404 });
    }

    // Build query with filters
    // Must have BOTH status='published' AND published_at IS NOT NULL
    let query = supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .eq('journal_id', journal.id)
      .eq('status', 'published')
      .not('published_at', 'is', null);

    // Add search filter if provided
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    // Add sorting
    switch (sort) {
      case 'oldest':
        query = query.order('published_at', { ascending: true });
        break;
      case 'views':
        query = query.order('view_count', { ascending: false });
        break;
      case 'title':
        query = query.order('title', { ascending: true });
        break;
      case 'newest':
      default:
        query = query.order('published_at', { ascending: false });
        break;
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    const { data: posts, error, count } = await query;

    if (error) {
      return handleError(error);
    }

    // Generate excerpts for posts
    const postsWithExcerpts = (posts || []).map(post => ({
      ...post,
      excerpt: post.content ? post.content.slice(0, 150) + (post.content.length > 150 ? '...' : '') : '',
    }));

    const response: PostsResponse = {
      posts: postsWithExcerpts,
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
      limit,
      offset,
    };

    return NextResponse.json(response);
  } catch (error) {
    return handleError(error);
  }
}
