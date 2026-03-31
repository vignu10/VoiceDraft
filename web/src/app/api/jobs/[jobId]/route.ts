import { NextRequest, NextResponse } from 'next/server';
import { handleError, requireAuth } from '@/lib/auth-helpers';
import { getQueue, JobType, TranscriptionJobData, GenerationJobData } from '@/lib/queue';

/**
 * GET /api/jobs/:jobId - Check job status
 *
 * Returns the current status of an async job (transcription or generation)
 */
export async function GET(req: NextRequest, { params }: { params: { jobId: string } }) {
  try {
    // Require authentication for all job status checks
    await requireAuth(req);

    // Extract job type from jobId (format: "type_timestamp_random" or "transcribe_..." or "generate_...")
    const jobType = params.jobId.split('_')[0] as JobType;

    if (jobType !== 'transcribe' && jobType !== 'generate') {
      return NextResponse.json(
        { error: 'Invalid job ID format' },
        { status: 400 }
      );
    }

    const queue = getQueue();
    const job = await queue.getJob(params.jobId, jobType);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found or expired' },
        { status: 404 }
      );
    }

    // Return job status with result if available
    return NextResponse.json({
      id: job.id,
      type: job.name,
      status: job.status,
      result: job.returnvalue,
      error: job.failedReason,
      createdAt: job.createdAt,
      finishedAt: job.finishedOn,
    });
  } catch (error) {
    return handleError(error, 'Failed to fetch job status');
  }
}

/**
 * POST /api/jobs/:jobId - Retry a failed job
 *
 * Retries a failed transcription or generation job
 */
export async function POST(req: NextRequest, { params }: { params: { jobId: string } }) {
  try {
    await requireAuth(req);

    // Extract job type from jobId
    const jobType = params.jobId.split('_')[0] as JobType;

    if (jobType !== 'transcribe' && jobType !== 'generate') {
      return NextResponse.json(
        { error: 'Invalid job ID format' },
        { status: 400 }
      );
    }

    const queue = getQueue();
    const job = await queue.getJob(params.jobId, jobType);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Only failed jobs can be retried
    if (job.status !== 'failed') {
      return NextResponse.json(
        { error: 'Only failed jobs can be retried' },
        { status: 400 }
      );
    }

    // Re-queue the job with the same data
    const jobData = job.data as TranscriptionJobData | GenerationJobData;
    const newJobId = await queue.addJob(jobType, jobData);

    return NextResponse.json({
      success: true,
      message: 'Job requeued successfully',
      newJobId,
    });
  } catch (error) {
    return handleError(error, 'Failed to retry job');
  }
}

/**
 * DELETE /api/jobs/:jobId - Cancel/delete a job
 *
 * Allows cancellation of pending or processing jobs
 */
export async function DELETE(req: NextRequest, { params }: { params: { jobId: string } }) {
  try {
    await requireAuth(req);

    // Extract job type from jobId
    const jobType = params.jobId.split('_')[0] as JobType;

    if (jobType !== 'transcribe' && jobType !== 'generate') {
      return NextResponse.json(
        { error: 'Invalid job ID format' },
        { status: 400 }
      );
    }

    const queue = getQueue();
    const job = await queue.getJob(params.jobId, jobType);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Can only cancel pending or processing jobs
    if (job.status === 'pending' || job.status === 'processing') {
      await queue.updateJob(params.jobId, jobType, {
        status: 'failed',
        error: 'Job cancelled by user',
      });
    }

    return NextResponse.json({ success: true, message: 'Job cancelled' });
  } catch (error) {
    return handleError(error, 'Failed to cancel job');
  }
}

/**
 * Note: Helper functions for job management (createJob, updateJobStatus) are available in the queue module
 * Import them from @/lib/queue instead
 */
