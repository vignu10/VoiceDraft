import { NextRequest, NextResponse } from 'next/server';

function generateMarkdown(draft: any): string {
  const tags = draft.tags || [];
  const tagNames = tags.map((t: any) => t.name).join(', ') || 'None';
  const wordCount = draft.content ? draft.content.split(/\s+/).filter(Boolean).length : 0;
  const readingTime = Math.ceil(wordCount / 200);

  return `# ${draft.title || 'Untitled Draft'}

---
**Tags:** ${tagNames}
**Word Count:** ${wordCount}
**Reading Time:** ${readingTime} min
**Created:** ${new Date(draft.created_at).toLocaleDateString()}
**Status:** ${draft.status}
---

${draft.content || '*No content*'}
`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      },
    });

    if (!supabaseResponse.ok) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userData = await supabaseResponse.json();
    const userId = userData.id;

    // Fetch draft
    const response = await fetch(`${process.env.API_URL}/posts/${params.id}`, {
      headers: {
        'X-User-ID': userId,
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    const draft = await response.json();

    // Generate markdown
    const markdown = generateMarkdown(draft);

    return new NextResponse(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="${draft.title || 'draft'}.md"`,
      },
    });
  } catch (error) {
    console.error('Error exporting draft:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
