import { NextRequest, NextResponse } from 'next/server';
import { handleError, requireAuth } from '@/lib/auth-helpers';
import { getQueue, JobType } from '@/lib/queue';

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
 * Helper functions for job management (exported for use in other routes)
 */

export async function createJob(
  type: JobType,
  data: unknown,
  id?: string
): Promise<string> {
  const queue = getQueue();
  return await queue.addJob(type, data as Parameters<typeof queue.addJob>[1], { jobId: id });
}

export async function updateJobStatus(
  jobId: string,
  type: JobType,
  updates: {
    status: 'processing' | 'completed' | 'failed';
    result?: unknown;
    error?: string;
  }
): Promise<void> {
  const queue = getQueue();
  await queue.updateJob(jobId, type, updates);
}
