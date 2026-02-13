// ============================================================================
// Public Post API Route
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getPublishedPost } from '@/lib/database';

type RouteContext = {
  params: Promise<{ url_prefix: string; slug: string }>;
};

// ============================================================================
// GET /api/journals/[url_prefix]/posts/[slug] - Get single published post (public)
// ============================================================================

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { url_prefix, slug } = await context.params;
    const post = await getPublishedPost(url_prefix, slug);

    if (!post) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Post not found',
          code: 'POST_NOT_FOUND',
        },
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error('Error getting public post:', error);
    return NextResponse.json({
      success: false,
      error: {
        message: 'Internal server error',
      },
    }, { status: 500 });
  }
}
