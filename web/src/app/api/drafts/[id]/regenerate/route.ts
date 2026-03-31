import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateBlogPost } from '@/lib/openai';
import { getQueue } from '@/lib/queue';
import { handleError } from '@/lib/auth-helpers';

/**
 * POST /api/drafts/[id]/regenerate
 *
 * Regenerates the entire blog post from the transcript using GPT-4.
 * Uses the user's journal style preferences for generation.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get post with journal to verify ownership and get transcript
    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .select(`
        *,
        journal!inner (
          id,
          auth_user_id,
          styles
        )
      `)
      .eq('id', params.id)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Verify ownership
    if (post.journal.auth_user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if transcript exists
    if (!post.transcript) {
      return NextResponse.json(
        { error: 'No transcript found. Cannot regenerate without transcript.' },
        { status: 400 }
      );
    }

    // Extract style settings from journal
    const styles = (post.journal.styles as any[]) || [];
    const activeStyle = styles.find((s: any) => s.is_active) || styles[0];
    const tone = activeStyle?.tone || 'professional';
    const targetLength = activeStyle?.length === 'long' ? '1500-2000' :
                       activeStyle?.length === 'short' ? '500-800' :
                       '1000-1500';

    // Create job for tracking
    const queue = getQueue();
    const jobId = `regenerate_${params.id}_${Date.now()}`;

    try {
      await queue.updateJob(jobId, 'generate', { status: 'processing' });
    } catch (error) {
      // Job creation might fail in fallback mode, continue anyway
      console.warn('Failed to create queue job:', error);
    }

    try {
      // Generate new blog post content
      const generated = await generateBlogPost({
        transcript: post.transcript,
        target_keyword: post.target_keyword || undefined,
        tone,
        target_length: targetLength,
      });

      // Update post with regenerated content
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('posts')
        .update({
          title: generated.title,
          content: generated.content,
          meta_description: generated.metaDescription,
          word_count: generated.wordCount,
          reading_time_minutes: Math.ceil(generated.wordCount / 200),
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update post: ${updateError.message}`);
      }

      // Mark job as completed
      try {
        await queue.updateJob(jobId, 'generate', {
          status: 'completed',
          result: {
            title: generated.title,
            wordCount: generated.wordCount,
            metaDescription: generated.metaDescription,
          },
        });
      } catch (error) {
        console.warn('Failed to update job status:', error);
      }

      return NextResponse.json({
        success: true,
        post: updated,
        jobId,
      });

    } catch (generationError) {
      // Mark job as failed
      try {
        await queue.updateJob(jobId, 'generate', {
          status: 'failed',
          error: generationError instanceof Error ? generationError.message : 'Unknown error',
        });
      } catch (error) {
        console.warn('Failed to update job status:', error);
      }

      throw generationError;
    }

  } catch (error) {
    return handleError(error, 'Post regeneration failed');
  }
}
