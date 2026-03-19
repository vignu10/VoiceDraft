import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
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

    // Fetch all user data
    const [postsResponse, tagsResponse, profileResponse] = await Promise.all([
      fetch(`${process.env.API_URL}/posts`, {
        headers: { 'X-User-ID': userId },
      }),
      fetch(`${process.env.API_URL}/tags`, {
        headers: { 'X-User-ID': userId },
      }),
      fetch(`${process.env.API_URL}/profile`, {
        headers: { 'X-User-ID': userId },
      }),
    ]);

    const posts = postsResponse.ok ? await postsResponse.json() : [];
    const tags = tagsResponse.ok ? await tagsResponse.json() : [];
    const profile = profileResponse.ok ? await profileResponse.json() : null;

    const backup = {
      version: '1.0',
      export_date: new Date().toISOString(),
      user_id: userId,
      profile,
      posts,
      tags,
    };

    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="voicescribe-backup-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting backup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    const backup = JSON.parse(text);

    // Validate backup structure
    if (!backup.version || !backup.posts || !backup.tags) {
      return NextResponse.json({ error: 'Invalid backup file' }, { status: 400 });
    }

    // Import tags first
    let importedTags = 0;
    for (const tag of backup.tags || []) {
      try {
        await fetch(`${process.env.API_URL}/tags`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': userId,
          },
          body: JSON.stringify({
            name: tag.name,
            color: tag.color,
          }),
        });
        importedTags++;
      } catch (e) {
        console.error('Failed to import tag:', tag.name);
      }
    }

    // Import posts
    let importedPosts = 0;
    for (const post of backup.posts || []) {
      try {
        await fetch(`${process.env.API_URL}/posts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': userId,
          },
          body: JSON.stringify({
            title: post.title,
            content: post.content,
            status: post.status,
            tags: post.tags,
          }),
        });
        importedPosts++;
      } catch (e) {
        console.error('Failed to import post:', post.title);
      }
    }

    return NextResponse.json({
      success: true,
      posts_count: importedPosts,
      tags_count: importedTags,
    });
  } catch (error) {
    console.error('Error importing backup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
