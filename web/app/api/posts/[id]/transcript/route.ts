// ============================================================================
// Update Post Transcript API Route
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { updatePostTranscript } from '@/lib/database';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// ============================================================================
// PATCH /api/posts/[id]/transcript - Update post transcript
// ============================================================================

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await verifyAuth(request);
    const { id } = await context.params;

    const body = await request.json();
    const { transcript } = body;

    if (!transcript) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Transcript is required',
          code: 'MISSING_TRANSCRIPT',
        },
      }, { status: 400 });
    }

    const post = await updatePostTranscript(id, transcript);

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
    console.error('Error updating transcript:', error);
    return NextResponse.json({
      success: false,
      error: {
        message: 'Internal server error',
      },
    }, { status: 500 });
  }
}
