// ============================================================================
// Journals API Routes
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getUserJournal, updateJournal } from '@/lib/database';

// ============================================================================
// GET /api/journals - Get user's journal
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    const journal = await getUserJournal(user.id);

    if (!journal) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Journal not found',
          code: 'JOURNAL_NOT_FOUND',
        },
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: journal,
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
    console.error('Error getting journal:', error);
    return NextResponse.json({
      success: false,
      error: {
        message: 'Internal server error',
      },
    }, { status: 500 });
  }
}

// ============================================================================
// PUT /api/journals - Update user's journal
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    const body = await request.json();
    const { displayName, description } = body;

    if (!displayName) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Display name is required',
          code: 'MISSING_DISPLAY_NAME',
        },
      }, { status: 400 });
    }

    const updates = {
      display_name: displayName,
      description,
    };

    const journal = await updateJournal(user.journalId, updates);

    if (!journal) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Journal not found',
          code: 'JOURNAL_NOT_FOUND',
        },
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: journal,
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
    console.error('Error updating journal:', error);
    return NextResponse.json({
      success: false,
      error: {
        message: 'Internal server error',
      },
    }, { status: 500 });
  }
}
