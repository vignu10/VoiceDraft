// ============================================================================
// Publish Post API Route
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { publishPost } from '@/lib/database';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// ============================================================================
// POST /api/posts/[id]/publish - Publish a post
// ============================================================================

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await verifyAuth(request);
    const { id } = await context.params;

    const post = await publishPost(id);

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
    if (error instanceof Error && 'statusCode' in error) {
      return NextResponse.json({
        success: false,
        error: {
          message: error.message,
        },
      }, { status: (error as any).statusCode });
    }
    console.error('Error publishing post:', error);
    return NextResponse.json({
      success: false,
      error: {
        message: 'Internal server error',
      },
    }, { status: 500 });
  }
}
