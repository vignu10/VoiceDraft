import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { handleError } from '@/lib/auth-helpers';
import type { Post, CreatePostRequest } from '@/lib/types';

// GET list posts
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user's journal
    const { data: journal } = await supabaseAdmin
      .from('journals')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (!journal) {
      return NextResponse.json([]);
    }

    // Get status filter from query
    const { searchParams } = new URL(req.url!);
    const statusFilter = searchParams.get('status') || 'draft';

    const { data: posts, error } = await supabaseAdmin
      .from('posts')
      .select('*')
      .eq('journal_id', journal.id)
      .eq('status', statusFilter)
      .order('updated_at', { ascending: false });

    if (error) {
      return handleError(error, 'Failed to fetch posts');
    }

    return NextResponse.json(posts);
  } catch (error) {
    return handleError(error);
  }
}

// POST create new post
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body: CreatePostRequest = await req.json();

    // Get user's journal
    const { data: journal } = await supabaseAdmin
      .from('journals')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!journal) {
      return NextResponse.json({ error: 'Journal not found. Please create a journal first.' }, { status: 400 });
    }

    // Create slug from title if not provided
    const slug = body.slug || body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Date.now();

    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .insert({
        journal_id: journal.id,
        title: body.title,
        slug,
        content: body.content || '',
        meta_description: body.meta_description,
        target_keyword: body.target_keyword,
        transcript: body.transcript,
        // S3 audio fields
        audio_file_url: body.audio_file_url,
        audio_s3_key: body.audio_s3_key,
        audio_file_size_bytes: body.audio_file_size_bytes,
        audio_mime_type: body.audio_mime_type,
        audio_duration_seconds: body.audio_duration_seconds,
        audio_format: body.audio_format,
        // Other fields
        style_used: body.style_used || 0,
        word_count: body.word_count || 0,
        reading_time_minutes: Math.ceil((body.word_count || 0) / 200),
        view_count: 0,
        status: 'draft',
        audio_is_processed: !!body.transcript,
      })
      .select()
      .single();

    if (error) {
      return handleError(error, 'Failed to create post');
    }

    return NextResponse.json(post);
  } catch (error) {
    return handleError(error);
  }
}
