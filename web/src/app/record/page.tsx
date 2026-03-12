'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { WaveformVisualizer } from '@/components/recording/WaveformVisualizer';
import { Card } from '@/components/ui/Card';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useRecordingStore } from '@/stores/recording-store';
import { useDraftStore } from '@/stores/draft-store';
import { Mic, Square, RefreshCw } from 'lucide-react';

export default function RecordPage() {
  const router = useRouter();
  const { state, startRecording, stopRecording, requestPermission } = useAudioRecorder(
    (duration) => useRecordingStore.getState().setDuration(duration),
    (audioLevel) => useRecordingStore.getState().setAudioLevel(audioLevel)
  );
  const { isRecording, duration, audioLevel } = state;
  const { createDraft } = useDraftStore();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStartRecording = async () => {
    try {
      await startRecording();
      useRecordingStore.getState().startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to access microphone. Please grant permission and try again.');
    }
  };

  const handleStopRecording = async () => {
    setIsProcessing(true);
    try {
      const audioBlob = await stopRecording();
      useRecordingStore.getState().stopRecording();
      useRecordingStore.getState().setAudioBlob(audioBlob);

      // Create draft with audio
      const formData = new FormData();
      formData.append('audio', audioBlob, `recording-${Date.now()}.webm`);

      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/drafts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to create draft');
      }

      const draft = await response.json();

      // Transcribe audio
      try {
        const transcribeFormData = new FormData();
        transcribeFormData.append('file', audioBlob, `recording-${Date.now()}.webm`);

        const transcribeResponse = await fetch('/api/transcribe', {
          method: 'POST',
          body: transcribeFormData,
        });

        if (transcribeResponse.ok) {
          const { text } = await transcribeResponse.json();

          // Update draft with transcript
          await fetch(`/api/drafts/${draft.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              transcript: text,
              content: text,
            }),
          });
        }
      } catch (transcribeError) {
        console.error('Transcription failed:', transcribeError);
        // Continue anyway - draft is created
      }

      // Navigate to draft editor
      router.push(`/draft/${draft.id}`);
    } catch (error) {
      console.error('Failed to save recording:', error);
      alert('Failed to save recording. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelRecording = async () => {
    try {
      await stopRecording();
      useRecordingStore.getState().reset();
    } catch (error) {
      console.error('Failed to cancel recording:', error);
    }
  };

  // Check permission on mount
  useState(() => {
    requestPermission().then(setHasPermission);
  });

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Record Voice
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Transform your voice into organized drafts
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Recording section */}
          <div className="flex-1">
            <Card className="p-8">
              {/* Waveform visualizer */}
              <WaveformVisualizer
                isRecording={isRecording}
                audioLevel={audioLevel}
                duration={duration}
                className="mb-12"
              />

              {/* Record button */}
              <div className="flex justify-center">
                <button
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  disabled={isProcessing || hasPermission === false}
                  className={cn(
                    'relative w-48 h-48 rounded-full flex items-center justify-center',
                    'transition-all duration-300 ease-out',
                    'focus:outline-none focus:ring-4 focus:ring-primary-500/30',
                    'active:scale-95',
                    isRecording
                      ? 'bg-accent-500 hover:bg-accent-600 shadow-lg shadow-accent-500/30'
                      : 'bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/30',
                    (isProcessing || hasPermission === false) && 'opacity-50 cursor-not-allowed'
                  )}
                  aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                >
                  {isRecording ? (
                    <div className="w-16 h-16 bg-white rounded-md" />
                  ) : (
                    <Mic className="w-20 h-20 text-white" strokeWidth={1.5} />
                  )}

                  {/* Pulse animation when recording */}
                  {isRecording && (
                    <>
                      <span className="absolute inset-0 rounded-full bg-accent-500 animate-ping opacity-20" />
                      <span className="absolute inset-0 rounded-full bg-accent-500 animate-ping opacity-40 animation-delay-100" />
                    </>
                  )}
                </button>
              </div>

              {/* Action buttons */}
              {isRecording && (
                <div className="flex justify-center gap-4 mt-8">
                  <Button
                    variant="ghost"
                    onClick={handleCancelRecording}
                    disabled={isProcessing}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}

              {/* Permission notice */}
              {hasPermission === false && (
                <div className="mt-8 p-4 bg-accent-50 dark:bg-accent-950 rounded-xl">
                  <p className="text-sm text-accent-600 dark:text-accent-400 text-center">
                    Microphone access is required to record. Please grant permission in your
                    browser settings.
                  </p>
                </div>
              )}

              {/* Processing notice */}
              {isProcessing && (
                <div className="mt-8 p-4 bg-primary-50 dark:bg-primary-950 rounded-xl">
                  <p className="text-sm text-primary-600 dark:text-primary-400 text-center">
                    Processing your recording...
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Recent drafts */}
          <div className="lg:w-80">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              Recent Drafts
            </h2>
            <div className="space-y-3">
              <Card variant="draft" className="p-4">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Your recent drafts will appear here
                </p>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom navigation */}
      <nav
        role="navigation"
        aria-label="Main navigation"
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-around py-2">
            <button
              className="flex flex-col items-center px-4 py-2 text-primary-600"
              aria-current="page"
            >
              <Mic className="w-6 h-6" />
              <span className="text-xs mt-1 font-medium">Record</span>
            </button>
            <button className="flex flex-col items-center px-4 py-2 text-neutral-600 dark:text-neutral-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span className="text-xs mt-1 font-medium">Drafts</span>
            </button>
            <button className="flex flex-col items-center px-4 py-2 text-neutral-600 dark:text-neutral-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S13.284 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.716 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.424-3.113 1.167-4.418" />
              </svg>
              <span className="text-xs mt-1 font-medium">Discover</span>
            </button>
            <button className="flex flex-col items-center px-4 py-2 text-neutral-600 dark:text-neutral-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <span className="text-xs mt-1 font-medium">Profile</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
