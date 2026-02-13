// ============================================================================
// Single Post API Routes
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getPostById, updatePost, deletePost } from '@/lib/database';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// ============================================================================
// GET /api/posts/[id] - Get single post
// ============================================================================

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await verifyAuth(request);
    const { id } = await context.params;

    const post = await getPostById(id);

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
    console.error('Error getting post:', error);
    return NextResponse.json({
      success: false,
      error: {
        message: 'Internal server error',
      },
    }, { status: 500 });
  }
}

// ============================================================================
// PUT /api/posts/[id] - Update a post
// ============================================================================

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await verifyAuth(request);
    const { id } = await context.params;

    const body = await request.json();
    const updates: Record<string, any> = {};

    // Build update object from allowed fields
    const allowedFields = ['title', 'slug', 'content', 'meta_description', 'target_keyword'] as const;
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const post = await updatePost(id, updates);

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
    console.error('Error updating post:', error);
    return NextResponse.json({
      success: false,
      error: {
        message: 'Internal server error',
      },
    }, { status: 500 });
  }
}

// ============================================================================
// DELETE /api/posts/[id] - Delete a post
// ============================================================================

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await verifyAuth(request);
    const { id } = await context.params;

    await deletePost(id);

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully',
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
    console.error('Error deleting post:', error);
    return NextResponse.json({
      success: false,
      error: {
        message: 'Internal server error',
      },
    }, { status: 500 });
  }
}
