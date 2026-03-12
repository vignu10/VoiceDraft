import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/user/backup - Export all user data as JSON
export async function GET(req: NextRequest) {
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

    // Get all posts
    const { data: posts } = await supabase
      .from('posts')
      .select('*')
      .eq('auth_user_id', user.user.id)
      .order('created_at', { ascending: false });

    // Get all tags
    const { data: tags } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false });

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('auth_user_id', user.user.id)
      .single();

    const backup = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      user: {
        email: user.user.email,
        profile,
      },
      posts: posts || [],
      tags: tags || [],
    };

    // Return as downloadable JSON file
    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="voicedraft-backup-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json({ error: 'Failed to create backup' }, { status: 500 });
  }
}

// POST /api/user/backup - Import user data from JSON
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { posts, tags } = body;

    if (!Array.isArray(posts) || !Array.isArray(tags)) {
      return NextResponse.json({ error: 'Invalid backup format' }, { status: 400 });
    }

    const results = {
      posts: { imported: 0, failed: 0, errors: [] as string[] },
      tags: { imported: 0, failed: 0, errors: [] as string[] },
    };

    // Import tags first (posts may reference them)
    for (const tag of tags) {
      try {
        const { data: existingTag } = await supabase
          .from('tags')
          .select('id')
          .eq('name', tag.name)
          .eq('user_id', user.user.id)
          .single();

        if (existingTag) {
          results.tags.imported++;
          continue;
        }

        const { error } = await supabase.from('tags').insert({
          user_id: user.user.id,
          name: tag.name,
          color: tag.color,
          created_at: tag.created_at || new Date().toISOString(),
        });

        if (error) {
          results.tags.errors.push(`Tag "${tag.name}": ${error.message}`);
          results.tags.failed++;
        } else {
          results.tags.imported++;
        }
      } catch (e: any) {
        results.tags.errors.push(`Tag "${tag.name}": ${e.message}`);
        results.tags.failed++;
      }
    }

    // Import posts
    for (const post of posts) {
      try {
        // Check if post already exists
        const { data: existingPost } = await supabase
          .from('posts')
          .select('id')
          .eq('slug', post.slug)
          .eq('auth_user_id', user.user.id)
          .single();

        if (existingPost) {
          results.posts.imported++;
          continue;
        }

        const { error } = await supabase.from('posts').insert({
          auth_user_id: user.user.id,
          journal_id: post.journal_id,
          title: post.title,
          slug: post.slug,
          content: post.content || '',
          meta_description: post.meta_description,
          status: post.status || 'draft',
          word_count: post.word_count || 0,
          reading_time_minutes: post.reading_time_minutes || 0,
          transcript: post.transcript,
          created_at: post.created_at || new Date().toISOString(),
          updated_at: post.updated_at || new Date().toISOString(),
        });

        if (error) {
          results.posts.errors.push(`Post "${post.title}": ${error.message}`);
          results.posts.failed++;
        } else {
          results.posts.imported++;
        }
      } catch (e: any) {
        results.posts.errors.push(`Post "${post.title}": ${e.message}`);
        results.posts.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Imported ${results.posts.imported} posts and ${results.tags.imported} tags`,
    });
  } catch (error) {
    console.error('Error importing backup:', error);
    return NextResponse.json({ error: 'Failed to import backup' }, { status: 500 });
  }
}
