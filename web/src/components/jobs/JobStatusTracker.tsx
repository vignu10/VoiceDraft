'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Check, X, Loader2, AlertCircle } from 'lucide-react';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface JobState {
  id: string;
  type: 'transcribe' | 'generate';
  status: JobStatus;
  result?: any;
  error?: string;
  progress?: number;
  createdAt: number;
  updatedAt: number;
}

interface JobStatusTrackerProps {
  jobId: string | null;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
  pollInterval?: number;
  className?: string;
}

export function JobStatusTracker({
  jobId,
  onComplete,
  onError,
  pollInterval = 1000,
  className,
}: JobStatusTrackerProps) {
  const [job, setJob] = useState<JobState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchJobStatus = useCallback(async () => {
    if (!jobId) return;

    try {
      const response = await fetch(`/api/jobs/${jobId}`);

      if (!response.ok) {
        if (response.status === 404) {
          // Job not found or expired - this is expected for completed jobs
          return;
        }
        throw new Error('Failed to fetch job status');
      }

      const data = await response.json();
      setJob(data);

      if (data.status === 'completed' && data.result) {
        onComplete?.(data.result);
      } else if (data.status === 'failed' && data.error) {
        setError(data.error);
        onError?.(data.error);
      }
    } catch (err) {
      console.error('Failed to fetch job status:', err);
      // Don't set error state on polling failures - just log and continue
    }
  }, [jobId, onComplete, onError]);

  // Poll job status
  useEffect(() => {
    if (!jobId) return;

    // Initial fetch
    fetchJobStatus();

    // Set up polling
    const interval = setInterval(fetchJobStatus, pollInterval);

    // Cleanup when job is complete or failed, or component unmounts
    return () => {
      clearInterval(interval);
    };
  }, [jobId, pollInterval, fetchJobStatus]);

  // Stop polling when job reaches terminal state
  useEffect(() => {
    if (job?.status === 'completed' || job?.status === 'failed') {
      // Stop polling - handled in cleanup above
      return;
    }
  }, [job?.status]);

  if (!jobId || !job) {
    return null;
  }

  const statusConfig = {
    pending: {
      icon: Loader2,
      label: 'Queued',
      color: 'text-neutral-600 dark:text-neutral-400',
      bgColor: 'bg-neutral-100 dark:bg-neutral-900',
      pulse: true,
    },
    processing: {
      icon: Loader2,
      label: 'Processing',
      color: 'text-primary-600 dark:text-primary-400',
      bgColor: 'bg-primary-50 dark:bg-primary-950/50',
      pulse: true,
    },
    completed: {
      icon: Check,
      label: 'Complete',
      color: 'text-success-600 dark:text-success-400',
      bgColor: 'bg-success-50 dark:bg-success-950/50',
      pulse: false,
    },
    failed: {
      icon: X,
      label: 'Failed',
      color: 'text-error-600 dark:text-error-400',
      bgColor: 'bg-error-50 dark:bg-error-950/50',
      pulse: false,
    },
  };

  const config = statusConfig[job.status];
  const Icon = config.icon;

  return (
    <div className={cn('rounded-xl p-4 border transition-all duration-300', config.bgColor, {
      'border-neutral-200 dark:border-neutral-800': job.status === 'pending',
      'border-primary-200 dark:border-primary-800': job.status === 'processing',
      'border-success-200 dark:border-success-800': job.status === 'completed',
      'border-error-200 dark:border-error-800': job.status === 'failed',
    }, className)}>
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div className={cn('flex-shrink-0', config.color, config.pulse && 'animate-spin')}>
          <Icon className="w-5 h-5" strokeWidth={2} />
        </div>

        {/* Status details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className={cn('text-sm font-medium', config.color)}>
              {config.label}
            </p>
            {job.progress !== undefined && job.progress > 0 && job.progress < 100 && (
              <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                {job.progress}%
              </p>
            )}
          </div>

          {/* Progress bar */}
          {job.status === 'processing' && job.progress !== undefined && (
            <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-primary-500 transition-all duration-300 ease-out"
                style={{ width: `${job.progress}%` }}
              />
            </div>
          )}

          {/* Error message */}
          {job.status === 'failed' && (job.error || error) && (
            <div className="flex items-start gap-2 mt-2 p-2 bg-error-100 dark:bg-error-900/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-error-600 dark:text-error-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-error-700 dark:text-error-300 flex-1">
                {job.error || error}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
