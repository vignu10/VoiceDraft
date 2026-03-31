'use client';

import { useRef, useCallback, useEffect, useState } from 'react';

export interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioLevel: number;
  permissionState: 'idle' | 'granted' | 'denied' | 'not-allowed';
}

export type MicErrorType = 'permission-denied' | 'not-allowed' | 'other';

export interface UseAudioRecorderReturn {
  state: AudioRecorderState;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  requestPermission: () => Promise<boolean>;
  cancelRecording: () => void;
}

export function useAudioRecorder(
  onDurationChange?: (duration: number) => void,
  onAudioLevelChange?: (level: number) => void
): UseAudioRecorderReturn {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRecordingRef = useRef(false); // Separate ref for tracking recording state
  const pausedTimeRef = useRef(0); // Track accumulated paused time
  const pauseStartTimeRef = useRef<number | null>(null); // Track when pause started

  // Use useState to trigger re-renders - only update when values actually change
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioLevel: 0,
    permissionState: 'idle',
  });

  // Use ref to avoid dependency on state in callbacks
  const stateRef = useRef(state);
  stateRef.current = state;

  const callbacksRef = useRef({
    onDurationChange,
    onAudioLevelChange,
  });
  callbacksRef.current = { onDurationChange, onAudioLevelChange };

  const updateState = useCallback((updates: Partial<AudioRecorderState>) => {
    setState((prev) => {
      const newState = { ...prev, ...updates };

      // Only call callbacks when values actually change
      if (updates.duration !== undefined && updates.duration !== prev.duration) {
        callbacksRef.current.onDurationChange?.(updates.duration);
      }
      if (updates.audioLevel !== undefined && updates.audioLevel !== prev.audioLevel) {
        callbacksRef.current.onAudioLevelChange?.(updates.audioLevel);
      }

      return newState;
    });
  }, []);

  const measureAudioLevel = useCallback(() => {
    // Don't measure audio level when paused
    if (!analyserRef.current || !isRecordingRef.current || stateRef.current.isPaused) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average audio level
    const sum = dataArray.reduce((acc, val) => acc + val, 0);
    const average = sum / dataArray.length;
    const normalizedLevel = Math.min(100, (average / 128) * 100);

    updateState({ audioLevel: normalizedLevel });

    if (isRecordingRef.current) {
      animationFrameRef.current = requestAnimationFrame(measureAudioLevel);
    }
  }, [updateState]);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    pausedTimeRef.current = 0;
    pauseStartTimeRef.current = null;
    timerIntervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        // Calculate current paused time if we're currently paused
        let currentPausedTime = pausedTimeRef.current;
        if (stateRef.current.isPaused && pauseStartTimeRef.current) {
          currentPausedTime += Date.now() - pauseStartTimeRef.current;
        }

        const elapsed = Date.now() - startTimeRef.current - currentPausedTime;
        const seconds = Math.floor(elapsed / 1000);
        const currentDuration = stateRef.current.duration;
        if (seconds !== currentDuration) {
          updateState({ duration: seconds });
        }
      }
    }, 100);
  }, [updateState]);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    startTimeRef.current = null;
  }, []);

  const startRecording = useCallback(async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        },
      });

      // Set up audio analyser
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Set up media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms

      // Update refs first
      isRecordingRef.current = true;

      // Then update state
      updateState({ isRecording: true, isPaused: false, duration: 0, audioLevel: 0, permissionState: 'granted' });
      startTimer();

      // Start measuring audio level
      animationFrameRef.current = requestAnimationFrame(measureAudioLevel);
    } catch (error: unknown) {
      console.error('Error starting recording:', error);

      // Determine the type of error
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          updateState({ isRecording: false, isPaused: false, duration: 0, audioLevel: 0, permissionState: 'denied' });
          throw new Error('permission-denied');
        } else if (error.name === 'NotFoundError') {
          updateState({ isRecording: false, isPaused: false, duration: 0, audioLevel: 0, permissionState: 'not-allowed' });
          throw new Error('not-allowed');
        }
      }
      updateState({ isRecording: false, isPaused: false, duration: 0, audioLevel: 0, permissionState: 'idle' });
      // Reset pause tracking on error
      pausedTimeRef.current = 0;
      pauseStartTimeRef.current = null;
      throw new Error('Failed to access microphone');
    }
  }, [updateState, startTimer, measureAudioLevel]);

  const stopRecording = useCallback(async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current) {
        reject(new Error('No active recording'));
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        // Stop all tracks
        mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());

        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm;codecs=opus',
        });

        // Clean up
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        stopTimer();

        // Reset pause tracking
        pausedTimeRef.current = 0;
        pauseStartTimeRef.current = null;

        // Update refs
        isRecordingRef.current = false;

        // Update state
        updateState({ isRecording: false, isPaused: false, audioLevel: 0, permissionState: stateRef.current.permissionState });

        // Close audio context
        if (analyserRef.current) {
          try {
            // @ts-ignore - close() exists on AudioContext but not on BaseAudioContext
            analyserRef.current.context?.close();
          } catch {
            // Ignore if context is already closed
          }
        }

        resolve(audioBlob);
      };

      mediaRecorderRef.current.stop();
    });
  }, [updateState, stopTimer]);

  const pauseRecording = useCallback(() => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
      return;
    }

    // Pause the media recorder
    mediaRecorderRef.current.pause();

    // Track when pause started to calculate paused time
    pauseStartTimeRef.current = Date.now();

    // Update state
    updateState({ isPaused: true });
  }, [updateState]);

  const resumeRecording = useCallback(() => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'paused') {
      return;
    }

    // Resume the media recorder
    mediaRecorderRef.current.resume();

    // Add the paused time to the total paused time
    if (pauseStartTimeRef.current) {
      pausedTimeRef.current += Date.now() - pauseStartTimeRef.current;
      pauseStartTimeRef.current = null;
    }

    // Update state
    updateState({ isPaused: false });

    // Resume measuring audio level
    animationFrameRef.current = requestAnimationFrame(measureAudioLevel);
  }, [updateState, measureAudioLevel]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current.stop();
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    stopTimer();

    // Reset pause tracking
    pausedTimeRef.current = 0;
    pauseStartTimeRef.current = null;

    // Update refs
    isRecordingRef.current = false;

    // Update state
    updateState({ isRecording: false, isPaused: false, duration: 0, audioLevel: 0, permissionState: stateRef.current.permissionState });
  }, [updateState, stopTimer]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      updateState({ permissionState: 'granted' });
      return true;
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          updateState({ permissionState: 'denied' });
          return false;
        } else if (error.name === 'NotFoundError') {
          updateState({ permissionState: 'not-allowed' });
          return false;
        }
      }
      updateState({ permissionState: 'idle' });
      return false;
    }
  }, [updateState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelRecording();
    };
  }, [cancelRecording]);

  return {
    state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    requestPermission,
    cancelRecording,
  };
}
