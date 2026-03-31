'use client';

import { useState, useCallback } from 'react';
import type { JobStatus, JobState } from '@/components/jobs';

interface UseJobTrackerOptions {
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
  pollInterval?: number;
}

export function useJobTracker(options: UseJobTrackerOptions = {}) {
  const { onComplete, onError, pollInterval = 1000 } = options;

  const [jobId, setJobId] = useState<string | null>(null);
  const [jobState, setJobState] = useState<JobState | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startTracking = useCallback((id: string) => {
    setJobId(id);
    setIsTracking(true);
    setError(null);
  }, []);

  const stopTracking = useCallback(() => {
    setJobId(null);
    setJobState(null);
    setIsTracking(false);
    setError(null);
  }, []);

  const updateJobState = useCallback((state: JobState) => {
    setJobState(state);

    if (state.status === 'completed' && state.result) {
      onComplete?.(state.result);
      setIsTracking(false);
    } else if (state.status === 'failed' && state.error) {
      setError(state.error);
      onError?.(state.error);
      setIsTracking(false);
    }
  }, [onComplete, onError]);

  return {
    jobId,
    jobState,
    isTracking,
    error,
    startTracking,
    stopTracking,
    updateJobState,
    pollInterval,
  };
}
