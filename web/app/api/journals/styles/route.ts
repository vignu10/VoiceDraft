// ============================================================================
// Update Journal Styles API Route
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { updateJournal } from '@/lib/database';

// ============================================================================
// PUT /api/journals/styles - Update journal styles
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    const body = await request.json();
    const { styles } = body;

    if (!styles || !Array.isArray(styles)) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Styles must be an array of 3 style objects',
          code: 'INVALID_STYLES',
        },
      }, { status: 400 });
    }

    if (styles.length !== 3) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Exactly 3 styles are required',
          code: 'INVALID_STYLES_COUNT',
        },
      }, { status: 400 });
    }

    // Validate each style object
    for (const style of styles) {
      if (!style.name || !style.user_prompt_template || !style.tone || !style.length) {
        return NextResponse.json({
          success: false,
          error: {
            message: 'Each style must have name, user_prompt_template, tone, and length',
            code: 'INVALID_STYLE_OBJECT',
          },
        }, { status: 400 });
      }
    }

    const updates = {
      styles: styles as any,
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
    console.error('Error updating styles:', error);
    return NextResponse.json({
      success: false,
      error: {
        message: 'Internal server error',
      },
    }, { status: 500 });
  }
}
