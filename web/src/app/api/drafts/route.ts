import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { handleError } from '@/lib/auth-helpers';

// GET list drafts (alias for posts)
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
    const statusFilter = searchParams.get('status');

    let query = supabaseAdmin
      .from('posts')
      .select('*')
      .eq('journal_id', journal.id);

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data: posts, error } = await query.order('updated_at', { ascending: false });

    if (error) {
      return handleError(error, 'Failed to fetch drafts');
    }

    return NextResponse.json(posts || []);
  } catch (error) {
    return handleError(error);
  }
}

// POST create new draft (supports audio upload)
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

    // Check if multipart/form-data (audio upload)
    const contentType = req.headers.get('content-type') || '';
    let title = 'Untitled Draft';
    let transcript = '';
    let audioFileUrl = '';
    let audioS3Key = '';
    let audioFileSize = 0;
    let audioMimeType = '';
    let audioDuration = 0;
    let audioFormat: 'm4a' | 'mp3' | 'wav' | 'webm' = 'webm';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const audio = formData.get('audio') as File | null;
      title = formData.get('title') as string || 'Untitled Draft';

      if (audio) {
        // TODO: Upload to S3
        // For now, store basic info
        audioFileSize = audio.size;
        audioMimeType = audio.type;
        audioFormat = audio.type.includes('webm') ? 'webm' :
                      audio.type.includes('wav') ? 'wav' :
                      audio.type.includes('mp3') ? 'mp3' : 'm4a';
        audioDuration = parseInt(formData.get('audio_duration_seconds') as string) || 0;
      }
    } else {
      // JSON body
      const body = await req.json();
      title = body.title || 'Untitled Draft';
      transcript = body.transcript || '';
      audioFileUrl = body.audio_file_url || '';
      audioS3Key = body.audio_s3_key || '';
      audioFileSize = body.audio_file_size_bytes || 0;
      audioMimeType = body.audio_mime_type || '';
      audioDuration = body.audio_duration_seconds || 0;
      audioFormat = body.audio_format || 'webm';
    }

    // Get user's journal
    const { data: journal } = await supabaseAdmin
      .from('journals')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    // Create journal if it doesn't exist
    let journalId = journal?.id;
    if (!journalId) {
      const { data: newJournal } = await supabaseAdmin
        .from('journals')
        .insert({
          auth_user_id: user.id,
          url_prefix: user.email?.split('@')[0].toLowerCase() || 'user',
          display_name: "My Blog",
          is_active: true,
        })
        .select('id')
        .single();

      journalId = newJournal?.id;
    }

    if (!journalId) {
      return NextResponse.json({ error: 'Failed to create journal' }, { status: 500 });
    }

    // Create slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Date.now();

    const wordCount = transcript ? transcript.split(/\s+/).length : 0;

    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .insert({
        journal_id: journalId,
        title,
        slug,
        content: transcript || '',
        transcript,
        audio_file_url: audioFileUrl,
        audio_s3_key: audioS3Key,
        audio_file_size_bytes: audioFileSize,
        audio_mime_type: audioMimeType,
        audio_duration_seconds: audioDuration,
        audio_format: audioFormat,
        word_count: wordCount,
        reading_time_minutes: Math.ceil(wordCount / 200),
        view_count: 0,
        status: 'draft',
        audio_is_processed: !!transcript,
        style_used: 0,
      })
      .select()
      .single();

    if (error) {
      return handleError(error, 'Failed to create draft');
    }

    return NextResponse.json(post);
  } catch (error) {
    return handleError(error);
  }
}
