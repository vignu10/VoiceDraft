// ============================================================================
// Posts API Routes
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getUserPosts, createPost, isSlugUnique } from '@/lib/database';
import type { PostFilters } from '@/lib/types';

// ============================================================================
// GET /api/posts - Get user's posts
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    const searchParams = request.nextUrl.searchParams;
    const filters: PostFilters = {
      status: searchParams.get('status') as any || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : undefined,
    };

    const posts = await getUserPosts(user.journalId, filters);

    return NextResponse.json({
      success: true,
      data: posts,
      count: posts.length,
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
    console.error('Error getting posts:', error);
    return NextResponse.json({
      success: false,
      error: {
        message: 'Internal server error',
      },
    }, { status: 500 });
  }
}

// ============================================================================
// POST /api/posts - Create a new post
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    const body = await request.json();
    const { title, slug, content, styleUsed, audioS3Key, audioFileUrl } = body;

    // Validate required fields
    if (!title || !slug || !content || !audioS3Key || !audioFileUrl) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Missing required fields',
          code: 'MISSING_FIELDS',
        },
      }, { status: 400 });
    }

    // Check slug uniqueness
    const slugIsUnique = await isSlugUnique(user.journalId, slug);
    if (!slugIsUnique) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'A post with this slug already exists',
          code: 'SLUG_EXISTS',
        },
      }, { status: 409 });
    }

    const postData = {
      journalId: user.journalId,
      title,
      slug,
      content,
      metaDescription: body.metaDescription,
      targetKeyword: body.targetKeyword,
      audioS3Key,
      audioFileUrl,
      audioFileSizeBytes: body.audioFileSizeBytes,
      audioDurationSeconds: body.audioDurationSeconds,
      audioFormat: body.audioFormat,
      audioMimeType: body.audioMimeType,
      styleUsed,
    };

    const post = await createPost(postData);

    return NextResponse.json({
      success: true,
      data: post,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      return NextResponse.json({
        success: false,
        error: {
          message: error.message,
        },
      }, { status: (error as any).statusCode });
    }
    console.error('Error creating post:', error);
    return NextResponse.json({
      success: false,
      error: {
        message: 'Internal server error',
      },
    }, { status: 500 });
  }
}
