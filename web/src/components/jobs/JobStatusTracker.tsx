'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Check, X, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { VoiceScribeJob } from '@/lib/queue';

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

/**
 * Convert VoiceScribeJob to JobState
 */
function jobToState(job: VoiceScribeJob): JobState {
  return {
    id: job.id,
    type: job.name,
    status: job.status,
    result: job.returnvalue,
    error: job.failedReason,
    createdAt: job.createdAt,
    updatedAt: job.finishedOn || job.processedOn || job.createdAt,
  };
}

interface JobStatusTrackerProps {
  jobId: string | null;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
  onRetry?: () => void;
  pollInterval?: number;
  className?: string;
  enableRealtime?: boolean;
}

export function JobStatusTracker({
  jobId,
  onComplete,
  onError,
  onRetry,
  pollInterval = 1000,
  className,
  enableRealtime = true,
}: JobStatusTrackerProps) {
  const [job, setJob] = useState<JobState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [usingRealtime, setUsingRealtime] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const MAX_RETRY_ATTEMPTS = 3;

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

      // Convert VoiceScribeJob to JobState if needed
      const jobState = 'name' in data ? jobToState(data as VoiceScribeJob) : data as JobState;
      setJob(jobState);
      retryCountRef.current = 0; // Reset retry count on successful fetch

      if (jobState.status === 'completed' && jobState.result) {
        onComplete?.(jobState.result);
      } else if (jobState.status === 'failed' && jobState.error) {
        setError(jobState.error);
        onError?.(jobState.error);
      }
    } catch (err) {
      console.error('Failed to fetch job status:', err);
      // Don't set error state on polling failures - just log and continue
    }
  }, [jobId, onComplete, onError]);

  const setupRealtimeSubscription = useCallback(() => {
    if (!jobId || !enableRealtime) return null;

    try {
      // Subscribe to job updates via Supabase Realtime
      // Note: This requires Realtime to be enabled on the jobs table in Supabase
      const channel = supabase
        .channel(`job_${jobId}`)
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'jobs',
            filter: `id=eq.${jobId}`,
          },
          (payload) => {
            console.log('Realtime job update:', payload);
            if (payload.new) {
              // Convert VoiceScribeJob to JobState if needed
              const updatedJob = 'name' in payload.new
                ? jobToState(payload.new as VoiceScribeJob)
                : payload.new as JobState;
              setJob(updatedJob);

              if (updatedJob.status === 'completed' && updatedJob.result) {
                onComplete?.(updatedJob.result);
              } else if (updatedJob.status === 'failed' && updatedJob.error) {
                setError(updatedJob.error);
                onError?.(updatedJob.error);
              }
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Realtime subscription established');
            setUsingRealtime(true);
            setConnectionError(false);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn('Realtime subscription failed, falling back to polling');
            setUsingRealtime(false);
            setConnectionError(true);
          }
        });

      return channel;
    } catch (err) {
      console.error('Failed to setup realtime subscription:', err);
      setUsingRealtime(false);
      return null;
    }
  }, [jobId, enableRealtime, onComplete, onError]);

  const cleanupRealtime = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  const cleanupPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Setup realtime or polling based on availability
  useEffect(() => {
    if (!jobId) return;

    // Initial fetch
    fetchJobStatus();

    // Try to setup realtime first
    const channel = setupRealtimeSubscription();
    channelRef.current = channel;

    // If realtime fails or is disabled, setup polling as fallback
    if (!channel) {
      const interval = setInterval(fetchJobStatus, pollInterval);
      pollIntervalRef.current = interval;
    }

    // Cleanup
    return () => {
      cleanupRealtime();
      cleanupPolling();
    };
  }, [jobId, fetchJobStatus, setupRealtimeSubscription, cleanupRealtime, cleanupPolling, pollInterval]);

  // Stop tracking when job reaches terminal state
  useEffect(() => {
    if (job?.status === 'completed' || job?.status === 'failed') {
      // Cleanup subscriptions
      cleanupRealtime();
      cleanupPolling();
    }
  }, [job?.status, cleanupRealtime, cleanupPolling]);

  const handleRetry = useCallback(async () => {
    if (isRetrying || retryCountRef.current >= MAX_RETRY_ATTEMPTS) {
      return;
    }

    setIsRetrying(true);
    retryCountRef.current++;

    try {
      // Call the retry callback if provided
      if (onRetry) {
        await onRetry();
      } else {
        // Default retry behavior: call the retry API endpoint
        const response = await fetch(`/api/jobs/${jobId}`, {
          method: 'POST',
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to retry job');
        }

        const result = await response.json();

        // Update job ID to the new one returned from retry
        if (result.newJobId) {
          // Clear current job state and start tracking the new job
          setJob(null);
          setError(null);
          // The component will re-fetch with the new job ID
          // This requires the parent to update the jobId prop
        }
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry. Please try again later.');
    } finally {
      setIsRetrying(false);
    }
  }, [isRetrying, onRetry, jobId]);

  if (!jobId || !job) {
    return null;
  }

  const canRetry = job.status === 'failed' && retryCountRef.current < MAX_RETRY_ATTEMPTS;

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
    <div className={cn('rounded-xl p-4 border transition-opacity duration-300', config.bgColor, {
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
            <div className="flex items-center gap-2">
              <p className={cn('text-sm font-medium', config.color)}>
                {config.label}
              </p>
              {/* Realtime indicator */}
              {usingRealtime && job.status !== 'completed' && job.status !== 'failed' && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300 text-[10px] font-medium rounded-full">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success-500"></span>
                  </span>
                  Live
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {job.progress !== undefined && job.progress > 0 && job.progress < 100 && (
                <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  {job.progress}%
                </p>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {job.status === 'processing' && job.progress !== undefined && (
            <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-primary-500 transition-opacity duration-300 ease-out"
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

          {/* Retry button for failed jobs */}
          {canRetry && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className={cn(
                'mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
                'bg-error-100 hover:bg-error-200 dark:bg-error-900/30 dark:hover:bg-error-900/50',
                'text-error-700 dark:text-error-300',
                'disabled:opacity-50 disabled:cursor-not-allowed active:scale-95'
              )}
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Retry{retryCountRef.current > 0 ? ` (${MAX_RETRY_ATTEMPTS - retryCountRef.current} left)` : ''}
                </>
              )}
            </button>
          )}

          {/* Connection warning */}
          {connectionError && job.status !== 'completed' && job.status !== 'failed' && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
              Using polling for updates. Real-time connection unavailable.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
