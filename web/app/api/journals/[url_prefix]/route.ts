// ============================================================================
// Public Journal Posts API Route
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getJournalByUrlPrefix, getJournalPublishedPosts } from '@/lib/database';

type RouteContext = {
  params: Promise<{ url_prefix: string }>;
};

// ============================================================================
// GET /api/journals/[url_prefix] - Get journal info + published posts (public)
// ============================================================================

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { url_prefix } = await context.params;
    const journal = await getJournalByUrlPrefix(url_prefix);

    if (!journal) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Journal not found',
          code: 'JOURNAL_NOT_FOUND',
        },
      }, { status: 404 });
    }

    const posts = await getJournalPublishedPosts(url_prefix);

    return NextResponse.json({
      success: true,
      data: {
        journal: {
          urlPrefix: journal.url_prefix,
          displayName: journal.display_name,
          description: journal.description,
        },
        posts,
      },
    });
  } catch (error) {
    console.error('Error getting journal posts:', error);
    return NextResponse.json({
      success: false,
      error: {
        message: 'Internal server error',
      },
    }, { status: 500 });
  }
}
