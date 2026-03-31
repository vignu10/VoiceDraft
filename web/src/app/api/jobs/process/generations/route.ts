import { NextRequest, NextResponse } from 'next/server';
import { getQueue, GenerationJobData } from '@/lib/queue';
import { generateBlogPost } from '@/lib/openai';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/jobs/process/generations
 *
 * Processes pending blog generation jobs from the queue.
 * Takes transcripts and generates SEO-optimized blog posts using GPT-4.
 *
 * This endpoint is designed to be called by:
 * - Vercel Cron Jobs (scheduled processing)
 * - Webhook triggers (on-demand processing)
 * - Manual admin requests
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: [] as Array<{ jobId: string; error: string }>,
  };

  try {
    // Verify this is a cron job or authorized request
    const authHeader = req.headers.get('authorization');
    const cronSecret = req.headers.get('x-vercel-cron-secret') || process.env.CRON_SECRET;

    // Skip auth for local development
    const isLocal = process.env.NODE_ENV === 'development';
    const isCron = !!cronSecret;
    const isAuthorized = authHeader === `Bearer ${process.env.CRON_SECRET || cronSecret}`;

    if (!isLocal && !isCron && !isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const queue = getQueue();

    // Get queue health
    const health = await queue.getHealthStatus();
    const pendingCount = health.pendingGeneration;

    if (pendingCount === 0) {
      return NextResponse.json({
        message: 'No pending generation jobs',
        results,
        duration: Date.now() - startTime,
      });
    }

    // Query for posts that have transcripts but no generated content
    // These are candidates for blog generation
    const { data: postsNeedingGeneration, error: queryError } = await supabaseAdmin
      .from('posts')
      .select('id, transcript, title, meta_description, target_keyword, journal_id')
      .not('transcript', 'is', null)
      .lt('word_count', 500) // Only process short/empty posts
      .eq('status', 'draft')
      .limit(5) // Process up to 5 jobs per run (GPT-4 is slower)
      .order('created_at', { ascending: true });

    if (queryError) {
      console.error('Error querying posts needing generation:', queryError);
      throw queryError;
    }

    if (!postsNeedingGeneration || postsNeedingGeneration.length === 0) {
      return NextResponse.json({
        message: 'No posts needing generation found',
        results,
        duration: Date.now() - startTime,
      });
    }

    // Process each post
    for (const post of postsNeedingGeneration) {
      results.processed++;
      const jobId = `generate_${post.id}`;

      try {
        // Update job status to processing
        await queue.updateJob(jobId, 'generate', { status: 'processing' });

        // Get user's style preference from journal
        const { data: journal } = await supabaseAdmin
          .from('journals')
          .select('styles')
          .eq('id', post.journal_id)
          .single();

        // Extract style settings (default to first style)
        const styles = journal?.styles as any[] || [];
        const activeStyle = styles.find((s: any) => s.is_active) || styles[0];
        const tone = activeStyle?.tone || 'professional';
        const targetLength = activeStyle?.length === 'long' ? '1500-2000' :
                           activeStyle?.length === 'short' ? '500-800' :
                           '1000-1500';

        // Generate blog post using GPT-4
        const generated = await generateBlogPost({
          transcript: post.transcript || '',
          target_keyword: post.target_keyword || undefined,
          tone,
          target_length: targetLength,
        });

        // Update post with generated content
        const { error: updateError } = await supabaseAdmin
          .from('posts')
          .update({
            title: generated.title,
            content: generated.content,
            meta_description: generated.metaDescription,
            word_count: generated.wordCount,
            reading_time_minutes: Math.ceil(generated.wordCount / 200),
            updated_at: new Date().toISOString(),
            // Store target_keyword if it wasn't set before
            ...(post.target_keyword ? {} : { target_keyword: null }),
          })
          .eq('id', post.id);

        if (updateError) {
          throw new Error(`Failed to update post: ${updateError.message}`);
        }

        // Mark job as completed
        await queue.updateJob(jobId, 'generate', {
          status: 'completed',
          result: {
            title: generated.title,
            wordCount: generated.wordCount,
            metaDescription: generated.metaDescription,
          },
        });

        results.succeeded++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Failed to process generation for post ${post.id}:`, errorMessage);

        // Mark job as failed
        try {
          await queue.updateJob(jobId, 'generate', {
            status: 'failed',
            error: errorMessage,
          });
        } catch (queueError) {
          console.error('Failed to update job status:', queueError);
        }

        results.failed++;
        results.errors.push({ jobId, error: errorMessage });
      }
    }

    return NextResponse.json({
      message: `Processed ${results.processed} generation jobs`,
      results,
      duration: Date.now() - startTime,
    });
  } catch (error) {
    console.error('Generation processor error:', error);
    return NextResponse.json(
      {
        error: 'Generation processor failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        results,
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/jobs/process/generations
 *
 * Returns status information about the generation processor.
 */
export async function GET() {
  try {
    const queue = getQueue();
    const health = await queue.getHealthStatus();

    return NextResponse.json({
      status: 'healthy',
      queue: {
        connected: health.connected,
        pendingGeneration: health.pendingGeneration,
        recentCompleted: health.recentCompleted,
        recentFailed: health.recentFailed,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
