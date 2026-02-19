import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { handleError } from '@/lib/auth-helpers';

/**
 * Sync a guest draft to the authenticated user's account
 * POST /api/guest/sync
 *
 * This endpoint handles migrating a guest draft to a proper user account.
 * It creates a new post in the user's journal with all the guest draft data.
 */
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

    const body = await req.json();
    const {
      guestId,
      title,
      content,
      transcription,
      keywords,
      createdAt,
      audioS3Key,
      audioFileUrl,
      audioDuration,
      tone,
      length,
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 },
      );
    }

    // Get or create user's journal
    let { data: journal } = await supabaseAdmin
      .from('journals')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (!journal) {
      // Create a default journal for the user
      const { data: newJournal, error: journalError } = await supabaseAdmin
        .from('journals')
        .insert({
          auth_user_id: user.id,
          name: `${user.email?.split('@')[0] || 'My'}'s Journal`,
          description: 'My personal journal',
        })
        .select()
        .single();

      if (journalError || !newJournal) {
        return handleError(journalError, 'Failed to create journal');
      }
      journal = newJournal;
    }

    // Create slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Date.now();

    // Calculate word count
    const wordCount = content.split(/\s+/).filter((w: string) => w.length > 0).length;

    // Create the post from guest draft data
    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .insert({
        journal_id: journal!.id,
        title,
        slug,
        content,
        meta_description: content.slice(0, 160), // Simple excerpt
        target_keyword: keywords?.[0] || null,
        transcript: transcription,
        // S3 audio fields (if available from guest flow)
        audio_file_url: audioFileUrl,
        audio_s3_key: audioS3Key,
        audio_duration_seconds: audioDuration,
        // Other fields
        style_used: 0,
        word_count: wordCount,
        reading_time_minutes: Math.ceil(wordCount / 200),
        view_count: 0,
        status: 'draft',
        audio_is_processed: !!transcription,
        created_at: createdAt || new Date().toISOString(),
        // Store tone and length as metadata, plus guest ID for tracking
        metadata: {
          guestId, // Track which guest created this draft
          tone,
          length,
          keywords,
        },
      })
      .select()
      .single();

    if (error) {
      return handleError(error, 'Failed to sync guest draft');
    }

    return NextResponse.json({
      success: true,
      post,
      message: 'Guest draft synced successfully',
    });
  } catch (error) {
    return handleError(error, 'Failed to sync guest draft');
  }
}
