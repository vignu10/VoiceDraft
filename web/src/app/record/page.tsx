'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { WaveformVisualizer } from '@/components/recording/WaveformVisualizer';
import { Card } from '@/components/ui/Card';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useRecordingStore } from '@/stores/recording-store';
import { useDraftStore } from '@/stores/draft-store';
import { WithBottomNav, BottomNav } from '@/components/layout/BottomNav';
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
    <WithBottomNav>
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

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
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
      </div>
    </WithBottomNav>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
