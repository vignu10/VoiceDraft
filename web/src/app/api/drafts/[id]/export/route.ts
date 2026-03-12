import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/drafts/[id]/export - Export draft as markdown
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: user } = await supabase.auth.getUser(token);

    if (!user.user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id } = await params;

    // Get draft
    const { data: draft, error } = await supabase
      .from('posts')
      .select('*, tags(id, name, color)')
      .eq('id', id)
      .eq('auth_user_id', user.user.id)
      .single();

    if (error || !draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Generate markdown
    const markdown = generateMarkdown(draft);

    // Return as downloadable file
    return new NextResponse(markdown, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${draft.title.replace(/[^a-z0-9]/gi, '-')}.md"`,
      },
    });
  } catch (error) {
    console.error('Error exporting draft:', error);
    return NextResponse.json({ error: 'Failed to export draft' }, { status: 500 });
  }
}

function generateMarkdown(draft: any): string {
  const lines: string[] = [];

  // Title
  lines.push(`# ${draft.title || 'Untitled Draft'}`);
  lines.push('');

  // Meta info
  if (draft.meta_description) {
    lines.push(`> ${draft.meta_description}`);
    lines.push('');
  }

  // Tags
  if (draft.tags && draft.tags.length > 0) {
    const tagNames = draft.tags.map((t: any) => t.name).join(', ');
    lines.push(`**Tags:** ${tagNames}`);
    lines.push('');
  }

  // Stats
  lines.push(`**Word Count:** ${draft.word_count || 0}`);
  lines.push(`**Reading Time:** ${draft.reading_time_minutes || 0} min`);
  lines.push('');

  // Date
  if (draft.created_at) {
    const createdDate = new Date(draft.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    lines.push(`**Created:** ${createdDate}`);
    lines.push('');
  }

  // Content
  lines.push('---');
  lines.push('');
  lines.push(draft.content || '*No content*');

  return lines.join('\n');
}
