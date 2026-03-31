import { NextRequest, NextResponse } from 'next/server';
import { getQueue, TranscriptionJobData } from '@/lib/queue';
import { transcribeAudio } from '@/lib/openai';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/jobs/process/transcriptions
 *
 * Processes pending transcription jobs from the queue.
 * This endpoint is designed to be called by:
 * - Vercel Cron Jobs (scheduled processing)
 * - Webhook triggers (on-demand processing)
 * - Manual admin requests
 *
 * For production, consider running this as a dedicated worker process
 * rather than a serverless endpoint for better reliability.
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

    // Get queue health to see pending jobs
    const health = await queue.getHealthStatus();
    const pendingCount = health.pendingTranscription;

    if (pendingCount === 0) {
      return NextResponse.json({
        message: 'No pending transcription jobs',
        results,
        duration: Date.now() - startTime,
      });
    }

    // For now, we'll process a single job per invocation
    // In a full worker implementation, you'd loop through multiple jobs
    // respecting timeout limits (Vercel serverless functions have max duration)

    // Note: In a real BullMQ setup, we'd use Worker.process() but our
    // VoiceScribeQueue is a custom implementation for serverless compatibility

    // Get pending jobs from Redis/fallback storage
    // Since our custom queue doesn't expose a "get pending jobs" method,
    // we need to query the database for posts with unprocessed audio
    const { data: unprocessedPosts, error: queryError } = await supabaseAdmin
      .from('posts')
      .select('id, audio_s3_key, audio_file_url, journal_id')
      .eq('audio_is_processed', false)
      .not('audio_s3_key', 'is', null)
      .limit(10) // Process up to 10 jobs per run
      .order('created_at', { ascending: true });

    if (queryError) {
      console.error('Error querying unprocessed posts:', queryError);
      throw queryError;
    }

    if (!unprocessedPosts || unprocessedPosts.length === 0) {
      return NextResponse.json({
        message: 'No unprocessed audio found',
        results,
        duration: Date.now() - startTime,
      });
    }

    // Process each unprocessed post
    for (const post of unprocessedPosts) {
      results.processed++;
      const jobId = `transcribe_${post.id}`;

      try {
        // Update job status to processing
        await queue.updateJob(jobId, 'transcribe', { status: 'processing' });

        // Download audio from Supabase Storage
        let audioBuffer: Buffer;
        let mimeType = 'audio/webm';

        if (post.audio_s3_key) {
          // Download from Supabase Storage
          const { data: fileData, error: downloadError } = await supabaseAdmin.storage
            .from('audio')
            .download(post.audio_s3_key);

          if (downloadError || !fileData) {
            throw new Error(`Failed to download audio: ${downloadError?.message || 'unknown error'}`);
          }

          // Convert Blob to Buffer
          const arrayBuffer = await fileData.arrayBuffer();
          audioBuffer = Buffer.from(arrayBuffer);

          // Detect MIME type from file extension
          const ext = post.audio_s3_key.split('.').pop()?.toLowerCase();
          mimeType = ext === 'mp3' ? 'audio/mpeg' :
                     ext === 'wav' ? 'audio/wav' :
                     ext === 'm4a' ? 'audio/m4a' :
                     'audio/webm';
        } else if (post.audio_file_url) {
          // Download from URL (fallback for S3 or external URLs)
          const response = await fetch(post.audio_file_url);
          if (!response.ok) {
            throw new Error(`Failed to download audio from URL: ${response.statusText}`);
          }
          const arrayBuffer = await response.arrayBuffer();
          audioBuffer = Buffer.from(arrayBuffer);
        } else {
          throw new Error('No audio source found');
        }

        // Transcribe using OpenAI Whisper
        const transcriptionResult = await transcribeAudio(audioBuffer, mimeType);

        // Update post with transcription
        const { error: updateError } = await supabaseAdmin
          .from('posts')
          .update({
            transcript: transcriptionResult.text,
            audio_duration_seconds: Math.round(transcriptionResult.duration),
            audio_is_processed: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', post.id);

        if (updateError) {
          throw new Error(`Failed to update post: ${updateError.message}`);
        }

        // Mark job as completed
        await queue.updateJob(jobId, 'transcribe', {
          status: 'completed',
          result: {
            text: transcriptionResult.text,
            duration: transcriptionResult.duration,
            language: transcriptionResult.language,
          },
        });

        results.succeeded++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Failed to process transcription for post ${post.id}:`, errorMessage);

        // Mark job as failed
        try {
          await queue.updateJob(jobId, 'transcribe', {
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
      message: `Processed ${results.processed} transcription jobs`,
      results,
      duration: Date.now() - startTime,
    });
  } catch (error) {
    console.error('Transcription processor error:', error);
    return NextResponse.json(
      {
        error: 'Transcription processor failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        results,
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/jobs/process/transcriptions
 *
 * Returns status information about the transcription processor.
 * Useful for health checks and monitoring.
 */
export async function GET() {
  try {
    const queue = getQueue();
    const health = await queue.getHealthStatus();

    return NextResponse.json({
      status: 'healthy',
      queue: {
        connected: health.connected,
        pendingTranscription: health.pendingTranscription,
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
