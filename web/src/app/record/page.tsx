'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { WaveformVisualizer } from '@/components/recording/WaveformVisualizer';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAuthStore } from '@/stores/auth-store';
import { useGuestStore } from '@/stores/guest-store';
import { useToast } from '@/components/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api-client';
import { WithBottomNav } from '@/components/layout/BottomNav';
import {
  MIN_RECORDING_DURATION,
  MAX_RECORDING_DURATION,
  MIN_TRANSCRIPT_LENGTH,
  MIN_TRANSCRIPT_WORDS,
  RECORDING_MILESTONES,
  MILESTONE_MESSAGES,
  AUDIO_ACTIVITY_THRESHOLD,
} from '@/lib/constants';
import {
  Mic,
  Square,
  RefreshCw,
  AlertCircle,
  FileText,
  Check,
  ArrowRight,
  Sparkles,
  Search,
  Briefcase,
  MessageSquare,
  Zap,
  Newspaper,
  X,
  MicOff,
  Settings,
} from 'lucide-react';

type ViewState = 'idle' | 'recording' | 'options' | 'processing' | 'complete' | 'error' | 'permission-denied' | 'session-expired';
type ProcessingStep = 'transcribing' | 'generating' | 'ready';
type Tone = 'professional' | 'casual' | 'conversational';
type Length = 'short' | 'medium' | 'long';

interface GeneratedBlog {
  title: string;
  content: string;
  metaDescription?: string;
  wordCount?: number;
}

const TONES: { value: Tone; icon: typeof Briefcase; label: string; description: string }[] = [
  { value: 'professional', icon: Briefcase, label: 'Professional', description: 'Formal and business-focused' },
  { value: 'casual', icon: MessageSquare, label: 'Casual', description: 'Relaxed and friendly' },
  { value: 'conversational', icon: MessageSquare, label: 'Conversational', description: 'Like chatting with a friend' },
];

const LENGTHS: { value: Length; icon: typeof Zap; label: string; words: string; description: string }[] = [
  { value: 'short', icon: Zap, label: 'Short', words: '150-300 words', description: 'Quick updates' },
  { value: 'medium', icon: Newspaper, label: 'Medium', words: '400-600 words', description: 'Standard articles' },
  { value: 'long', icon: FileText, label: 'Long', words: '800-1200 words', description: 'In-depth content' },
];

export default function RecordPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, validateSession, checkSessionOnMount } = useAuthStore();
  const { addGuestDraft } = useGuestStore();

  // Session validation state
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [useGuestMode, setUseGuestMode] = useState(false);

  // Check session on mount - BEFORE allowing any recording
  useEffect(() => {
    const checkSession = async () => {
      // If user has a token (was previously logged in), validate it
      if (accessToken && isAuthenticated) {
        setIsCheckingSession(true);
        setSessionError(null);

        const isValid = await validateSession();

        setIsCheckingSession(false);

        if (!isValid) {
          // Session is expired - show error and block recording
          setSessionError('Your session has expired. Please sign in again to continue.');
          setViewState('session-expired');
          return;
        }
      } else if (!accessToken && !isAuthenticated) {
        // No token - user can choose to sign in or use guest mode
        setUseGuestMode(true);
      }
    };

    checkSession();
  }, [accessToken, isAuthenticated, validateSession]);

  // Listen for auth state changes (e.g., if session expires during recording)
  useRequireAuth({
    optional: true,
    onAuthRequired: () => {
      setSessionError('Your session has expired. Please sign in again.');
      setViewState('session-expired');
    },
  });

  const { success, warning } = useToast();
  const { state, startRecording, stopRecording, cancelRecording, requestPermission } = useAudioRecorder(
    (duration) => setDuration(duration),
    (audioLevel) => setAudioLevel(audioLevel)
  );
  const [viewState, setViewState] = useState<ViewState>('idle');
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('transcribing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [generatedBlog, setGeneratedBlog] = useState<GeneratedBlog | null>(null);
  const [createdDraftId, setCreatedDraftId] = useState<string | null>(null);
  const [processingMessage, setProcessingMessage] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  // Blog options
  const [targetKeyword, setTargetKeyword] = useState('');
  const [tone, setTone] = useState<Tone>('professional');
  const [length, setLength] = useState<Length>('medium');

  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const hasStartedProcessing = useRef(false);

  // Track audio levels for activity detection
  const audioLevelsRef = useRef<number[]>([]);
  const lastShownMilestone = useRef<number>(0);

  const TRANSCRIBE_MESSAGES = [
    'Converting your voice to text...',
    'Analyzing speech patterns...',
    'Capturing your words...',
  ];

  const GENERATE_MESSAGES = [
    'Structuring your blog post...',
    'Polishing the content...',
    'Adding finishing touches...',
  ];

  useEffect(() => {
    if (viewState !== 'processing') return;
    const interval = setInterval(() => {
      setProcessingMessage(prev => (prev + 1) % 3);
    }, 2500);
    return () => clearInterval(interval);
  }, [viewState]);

  const handleStartRecording = async () => {
    // Prevent starting if we're still checking session or if session has expired
    if (isCheckingSession) {
      warning('Please wait while we verify your session...');
      return;
    }

    if (sessionError) {
      // Session expired - don't allow recording
      return;
    }

    // If user has a token but isn't authenticated, validate first
    if (accessToken && !isAuthenticated) {
      setIsCheckingSession(true);
      const isValid = await validateSession();
      setIsCheckingSession(false);

      if (!isValid) {
        setSessionError('Your session has expired. Please sign in again to continue.');
        setViewState('session-expired');
        return;
      }
    }

    setErrorMessage(null);
    try {
      await startRecording();
      setViewState('recording');
    } catch (err) {
      console.error('Failed to start recording:', err);
      // Check the error type and show appropriate UI
      if (err instanceof Error) {
        if (err.message === 'permission-denied' || err.message === 'not-allowed') {
          setViewState('permission-denied');
        } else {
          setErrorMessage('Failed to access microphone. Please grant permission and try again.');
        }
      }
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const processRecording = async () => {
    if (!audioBlob || hasStartedProcessing.current) return;
    hasStartedProcessing.current = true;

    setViewState('processing');
    setProcessingStep('transcribing');
    setProcessingMessage(0);
    setErrorMessage(null);

    try {
      const base64Audio = await blobToBase64(audioBlob);

      const transcribeResponse = await api.post('/api/transcribe/base64', {
        audio: base64Audio,
        format: 'webm',
      });

      if (!transcribeResponse.ok) {
        const errorData = await transcribeResponse.json().catch(() => ({ error: 'Transcription failed' }));
        throw new Error(errorData.error || 'Failed to transcribe audio');
      }

      const transcribeResult = await transcribeResponse.json();
      const transcriptText = transcribeResult.text || '';

      const trimmedTranscript = transcriptText.trim();

      // Validate transcript length
      if (trimmedTranscript.length < MIN_TRANSCRIPT_LENGTH) {
        throw new Error(`Transcript too short (need at least ${MIN_TRANSCRIPT_LENGTH} characters). Please record more content.`);
      }

      // Validate transcript word count
      const wordCount = trimmedTranscript.split(/\s+/).filter((w: string) => w.length > 0).length;
      if (wordCount < MIN_TRANSCRIPT_WORDS) {
        throw new Error(`Not enough words detected (need at least ${MIN_TRANSCRIPT_WORDS} words). Please speak more content.`);
      }

      setTranscript(trimmedTranscript);
      setProcessingStep('generating');

      const wordCountMap = {
        short: '150-300 words',
        medium: '400-600 words',
        long: '800-1200 words',
      };

      const generateResponse = await api.post('/api/generate', {
        transcript: trimmedTranscript,
        target_keyword: targetKeyword,
        tone: tone,
        target_length: wordCountMap[length as keyof typeof wordCountMap],
      });

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json().catch(() => ({ error: 'Generation failed' }));
        throw new Error(errorData.error || 'Failed to generate blog post');
      }

      const blogResult = await generateResponse.json();
      setGeneratedBlog({
        title: blogResult.title || 'Untitled Draft',
        content: blogResult.content || '',
        metaDescription: blogResult.metaDescription,
        wordCount: blogResult.wordCount || 0,
      });

      if (accessToken) {
        const draftFormData = new FormData();
        draftFormData.append('audio', audioBlob, `recording-${Date.now()}.webm`);
        draftFormData.append('audio_duration_seconds', Math.floor(duration).toString());
        draftFormData.append('title', blogResult.title || 'Untitled Draft');
        draftFormData.append('content', blogResult.content || '');
        draftFormData.append('transcript', trimmedTranscript);
        draftFormData.append('meta_description', blogResult.metaDescription || '');
        draftFormData.append('target_keyword', targetKeyword);
        draftFormData.append('tone', tone);
        draftFormData.append('target_length', length);

        const draftResponse = await api.post('/api/drafts', draftFormData);

        if (draftResponse.ok) {
          const draft = await draftResponse.json();
          setCreatedDraftId(draft.id);
        }
      }

      setProcessingStep('ready');
      setViewState('complete');
    } catch (err) {
      console.error('Processing failed:', err);
      const msg = err instanceof Error ? err.message : 'Failed to process recording. Please try again.';
      setErrorMessage(msg);
      setViewState('error');
      hasStartedProcessing.current = false;
    }
  };

  const handleStopRecording = async () => {
    setErrorMessage(null);

    // Check minimum recording duration
    if (duration < MIN_RECORDING_DURATION) {
      warning(`Recording too short. Please record for at least ${MIN_RECORDING_DURATION} seconds.`);
      // Don't stop - let user continue recording
      return;
    }

    // Check for audio activity
    if (!hasAudioActivity(audioLevelsRef.current)) {
      warning('No audio detected. Please speak clearly into your microphone.');
      // Allow proceeding but warn user
    }

    try {
      const blob = await stopRecording();
      setAudioBlob(blob);
      // Go to options screen after recording
      setViewState('options');
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to stop recording');
    }
  };

  const handleCancelRecording = () => {
    setErrorMessage(null);
    try {
      cancelRecording();
      setViewState('idle');
      setDuration(0);
      setAudioLevel(0);
      setAudioBlob(null);
      setTranscript('');
      setGeneratedBlog(null);
      setCreatedDraftId(null);
      hasStartedProcessing.current = false;
    } catch (err) {
      console.error('Failed to cancel recording:', err);
    }
  };

  const handleReset = () => {
    setViewState('idle');
    setProcessingStep('transcribing');
    setErrorMessage(null);
    setTranscript('');
    setGeneratedBlog(null);
    setCreatedDraftId(null);
    setTargetKeyword('');
    setTone('professional');
    setLength('medium');
    setAudioBlob(null);
    hasStartedProcessing.current = false;
  };

  const handleRetryGeneration = async () => {
    setErrorMessage(null);
    hasStartedProcessing.current = false;

    // If we have a transcript, go to options to retry generation
    if (transcript) {
      setViewState('options');
    } else {
      // No transcript, need to record again
      handleReset();
    }
  };

  const handleBackToRecording = () => {
    setViewState('idle');
    setDuration(0);
    setAudioLevel(0);
    setAudioBlob(null);
  };

  const handleStartProcessing = () => {
    processRecording();
  };

  const handleViewBlog = () => {
    if (createdDraftId) {
      router.push(`/draft/${createdDraftId}`);
    } else {
      router.push('/drafts');
    }
  };

  useEffect(() => {
    requestPermission().then(() => {});
  }, [requestPermission]);

  // Track audio levels for activity detection and show milestone toasts
  useEffect(() => {
    if (viewState === 'recording') {
      // Track audio levels (keep last 30 samples)
      audioLevelsRef.current.push(audioLevel);
      if (audioLevelsRef.current.length > 30) {
        audioLevelsRef.current.shift();
      }

      // Check for recording milestones
      if (duration > 0) {
        for (const milestone of RECORDING_MILESTONES) {
          if (duration === milestone && milestone > lastShownMilestone.current) {
            lastShownMilestone.current = milestone;
            const messages = MILESTONE_MESSAGES[milestone];
            if (messages) {
              const randomMessage = messages[Math.floor(Math.random() * messages.length)];
              success(randomMessage);
            }
          }
        }
      }

      // Auto-stop at max duration
      if (duration >= MAX_RECORDING_DURATION) {
        handleStopRecording();
        warning('Maximum recording time reached (10 minutes)');
      }
    } else {
      // Reset when not recording
      audioLevelsRef.current = [];
      if (viewState === 'idle') {
        lastShownMilestone.current = 0;
      }
    }
  }, [viewState, duration, audioLevel, success, warning]);

  // Helper function to check if there was audio activity
  const hasAudioActivity = (levels: number[]): boolean => {
    if (levels.length === 0) return false;
    // Convert from 0-100 scale to 0-1 scale for comparison
    const normalizedThreshold = AUDIO_ACTIVITY_THRESHOLD * 100;
    return levels.some(level => level > normalizedThreshold);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <WithBottomNav>
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-primary-950/50 flex flex-col">
      {/* Header - compact */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-frosted backdrop-blur-sm border-b border-neutral-200/50 dark:border-neutral-800/50">
        <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-start justify-between">
          <div className="text-left">
            <p className="text-xs font-semibold tracking-widest uppercase text-neutral-400 dark:text-neutral-500 mb-0.5">
              {viewState === 'idle' ? 'Ready'
                : viewState === 'recording' ? 'Recording'
                : viewState === 'options' ? 'Configure'
                : viewState === 'processing' ? 'Processing'
                : viewState === 'complete' ? 'Complete'
                : 'Error'}
            </p>
          </div>
          {viewState === 'options' && (
            <button
              onClick={handleBackToRecording}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Main content - asymmetric layout */}
      <main className="flex-1 flex items-center px-4 sm:px-6 lg:px-8 py-4 lg:py-6 pt-20 lg:pt-24">
        <div className="w-full max-w-5xl mx-auto grid lg:grid-cols-2 gap-6 lg:gap-12 items-start">
          {/* IDLE STATE - asymmetric editorial layout */}
          {viewState === 'idle' && (
            <>
              <div className="lg:col-span-1 order-2 lg:order-1 animate-in fade-in slide-in-from-left-8 duration-700">
                <div className="sticky top-32">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 leading-tight">
                    Speak.
                    <br />
                    <span className="text-neutral-400 dark:text-neutral-600">Create.</span>
                  </h2>
                  <p className="mt-6 text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-md">
                    Your voice, transformed into polished content. No typing required.
                  </p>
                  <div className="mt-8 flex items-center gap-6 text-sm text-neutral-500 dark:text-neutral-500">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-8 bg-neutral-900 dark:bg-neutral-100" />
                      <span>Instant transcription</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-8 bg-neutral-900 dark:bg-neutral-100" />
                      <span>AI-powered</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-1 order-1 lg:order-2 flex items-center justify-center lg:justify-end animate-in fade-in slide-in-from-right-8 duration-700 delay-100">
                <button
                  onClick={handleStartRecording}
                  disabled={isCheckingSession}
                  className="group w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 bg-gradient-to-br from-neutral-800 via-neutral-700 to-neutral-800 hover:from-neutral-700 hover:via-neutral-600 hover:to-neutral-700 disabled:from-neutral-600 disabled:via-neutral-500 disabled:to-neutral-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-neutral-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 disabled:opacity-70"
                  aria-label={isCheckingSession ? "Verifying session" : "Start recording"}
                >
                  {isCheckingSession ? (
                    <RefreshCw className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 animate-spin" strokeWidth={1.5} aria-hidden="true" />
                  ) : (
                    <Mic className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20" strokeWidth={1.5} aria-hidden="true" />
                  )}
                </button>
              </div>
            </>
          )}

          {/* RECORDING STATE - clean, focused */}
          {viewState === 'recording' && (
            <>
              <div className="lg:col-span-2 order-1 animate-in fade-in zoom-in duration-300">
                <div className="max-w-2xl mx-auto text-center">
                  {/* Giant timer */}
                  <div className="mb-8">
                    <div className={`inline-flex items-center justify-center gap-4 px-8 py-6 rounded-2xl transition-all duration-300 ${
                      duration >= MIN_RECORDING_DURATION
                        ? 'bg-gradient-to-br from-neutral-800 via-neutral-700 to-neutral-800 text-white shadow-lg shadow-neutral-500/20'
                        : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-2 border-neutral-200 dark:border-neutral-800'
                    }`}>
                      <span className="text-4xl sm:text-5xl font-bold tabular-nums tracking-tight">
                        {formatDuration(duration)}
                      </span>
                    </div>
                    {duration < MIN_RECORDING_DURATION && (
                      <p className="mt-4 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                        Min {MIN_RECORDING_DURATION}s required
                      </p>
                    )}
                    {duration >= MIN_RECORDING_DURATION && (
                      <p className="mt-4 text-sm font-medium text-primary-600 dark:text-primary-400 flex items-center justify-center gap-2">
                        <Check className="w-4 h-4" />
                        Ready to stop
                      </p>
                    )}
                  </div>

                  {/* Waveform */}
                  <div className="mb-10">
                    <WaveformVisualizer
                      isRecording={true}
                      audioLevel={audioLevel}
                      duration={duration}
                    />
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={handleCancelRecording}
                      className="min-h-[52px] px-6 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleStopRecording}
                      disabled={duration < MIN_RECORDING_DURATION}
                      className={`min-h-[52px] px-8 flex items-center gap-2 text-sm font-semibold rounded-xl transition-all ${
                        duration < MIN_RECORDING_DURATION
                          ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                          : 'bg-accent-500 hover:bg-accent-600 text-white shadow-lg shadow-accent-500/30'
                      }`}
                      aria-label={duration >= MIN_RECORDING_DURATION ? 'Stop recording' : 'Wait until minimum recording time'}
                    >
                      <Square className="w-4 h-4" fill="currentColor" />
                      Stop Recording
                    </button>
                  </div>

                  <p className="mt-8 text-xs text-neutral-400 dark:text-neutral-600">
                    Maximum {Math.floor(MAX_RECORDING_DURATION / 60)} minutes
                  </p>
                </div>
              </div>
            </>
          )}

          {/* OPTIONS STATE - clean configuration */}
          {viewState === 'options' && (
            <>
              <div className="lg:col-span-1 order-2 lg:order-1 animate-in fade-in slide-in-from-left-8 duration-500">
                <div className="sticky top-32">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-4">
                    Configure your post
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    These settings help shape the generated content. All optional—defaults work great too.
                  </p>
                </div>
              </div>
              <div className="lg:col-span-1 order-1 lg:order-2 animate-in fade-in slide-in-from-right-8 duration-500 delay-100">
                <div className="space-y-4">
                  {/* Keyword */}
                  <div className="group">
                    <label htmlFor="target-keyword" className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
                      Target Keyword
                    </label>
                    <div className="relative">
                      <input
                        id="target-keyword"
                        type="text"
                        value={targetKeyword}
                        onChange={(e) => setTargetKeyword(e.target.value)}
                        placeholder="e.g., productivity tips"
                        maxLength={100}
                        className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-900 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600 transition-all border-2 border-transparent focus:border-neutral-300 dark:focus:border-neutral-700"
                      />
                      {targetKeyword && (
                        <button
                          onClick={() => setTargetKeyword('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[36px] min-w-[36px] flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                          aria-label="Clear keyword input"
                          type="button"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tone */}
                  <fieldset>
                    <legend className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
                      Writing Tone
                    </legend>
                    <div className="flex gap-2">
                      {TONES.map((t) => (
                        <button
                          key={t.value}
                          onClick={() => setTone(t.value)}
                          aria-pressed={tone === t.value}
                          className={`flex-1 px-3 py-2.5 text-sm font-medium rounded-xl transition-all border-2 ${
                            tone === t.value
                              ? 'bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800 border-transparent text-white shadow-lg shadow-neutral-500/20'
                              : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-primary-300 dark:hover:border-primary-700'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  {/* Length */}
                  <fieldset>
                    <legend className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
                      Article Length
                    </legend>
                    <div className="flex gap-2">
                      {LENGTHS.map((l) => (
                        <button
                          key={l.value}
                          onClick={() => setLength(l.value)}
                          aria-pressed={length === l.value}
                          className={`flex-1 px-3 py-2.5 text-sm font-medium rounded-xl transition-all border-2 ${
                            length === l.value
                              ? 'bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800 border-transparent text-white shadow-lg shadow-neutral-500/20'
                              : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-primary-300 dark:hover:border-primary-700'
                          }`}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                      {LENGTHS.find(l => l.value === length)?.words}
                    </p>
                  </fieldset>

                  {/* Generate button */}
                  <button
                    onClick={handleStartProcessing}
                    className="w-full mt-6 min-h-[52px] px-6 bg-gradient-to-r from-accent-600 via-accent-500 to-accent-600 hover:from-accent-500 hover:via-accent-400 hover:to-accent-500 dark:from-accent-500 dark:via-accent-400 dark:to-accent-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent-500/30 ring-2 ring-accent-500/50"
                  >
                    <Sparkles className="w-5 h-5" />
                    Generate Blog Post
                  </button>

                  <button
                    onClick={handleBackToRecording}
                    className="w-full min-h-[44px] text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                  >
                    Record again
                  </button>
                </div>
              </div>
            </>
          )}

          {/* PROCESSING STATE - clean, focused */}
          {viewState === 'processing' && (
            <>
              <div className="lg:col-span-2 order-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="max-w-xl mx-auto text-center" aria-live="polite" aria-atomic="true">
                  {/* Animated icon */}
                  <div className="mb-8 flex justify-center">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        {processingStep === 'transcribing' ? (
                          <Mic className="w-10 h-10 text-neutral-900 dark:text-neutral-100" strokeWidth={1.5} />
                        ) : (
                          <Sparkles className="w-10 h-10 text-neutral-900 dark:text-neutral-100" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                    {processingStep === 'transcribing' ? 'Transcribing' : 'Generating'}
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    {processingStep === 'transcribing'
                      ? TRANSCRIBE_MESSAGES[processingMessage]
                      : GENERATE_MESSAGES[processingMessage]
                    }
                  </p>

                  {/* Step indicators */}
                  <div className="mt-8 flex items-center justify-center gap-4">
                    <div className={`flex items-center gap-2 text-sm font-medium ${
                      processingStep === 'transcribing' ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-400 dark:text-neutral-600'
                    }`}>
                      {processingStep === 'transcribing' ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Transcribe
                    </div>
                    <div className={`w-8 h-px ${
                      processingStep === 'generating' ? 'bg-neutral-900 dark:bg-neutral-100' : 'bg-neutral-300 dark:bg-neutral-700'
                    }`} />
                    <div className={`flex items-center gap-2 text-sm font-medium ${
                      processingStep === 'generating' ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-400 dark:text-neutral-600'
                    }`}>
                      {processingStep === 'generating' ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                      Generate
                    </div>
                  </div>

                  {transcript && (
                    <div className="mt-8 p-4 bg-neutral-100 dark:bg-neutral-900 rounded-lg text-left">
                      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
                        Your Transcript
                      </p>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-3">
                        {transcript}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* COMPLETE STATE - compact single-screen layout */}
          {viewState === 'complete' && generatedBlog && (
            <>
              {/* Mobile backdrop overlay */}
              <div className="lg:hidden fixed inset-0 bg-neutral-900/20 backdrop-blur-sm z-40" aria-hidden="true" />

              <div className="lg:col-span-2 order-1 fixed inset-x-0 bottom-0 top-auto max-h-[85vh] lg:static lg:max-h-none lg:rounded-t-3xl lg:rounded-xl bg-neutral-50 dark:bg-neutral-900 shadow-2xl lg:shadow-lg z-50 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col h-[calc(100vh-8rem)] lg:h-auto">
                  {/* Compact success header */}
                  <div className="flex items-center justify-between mb-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-success-500 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                      </div>
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {generatedBlog.wordCount} words · {tone}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5 border border-neutral-200 dark:border-neutral-700">
                      <button
                        onClick={() => {
                          setIsEditMode(false);
                          setEditedContent('');
                        }}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          !isEditMode
                            ? 'bg-white dark:bg-neutral-600 text-neutral-900 dark:text-white shadow-sm'
                            : 'text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        View
                      </button>
                      <button
                        onClick={() => {
                          setIsEditMode(true);
                          setEditedContent(generatedBlog.content);
                        }}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          isEditMode
                            ? 'bg-white dark:bg-neutral-600 text-neutral-900 dark:text-white shadow-sm'
                            : 'text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  {/* Content preview - takes available space */}
                  <div className="flex-1 min-h-0 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col mb-3">
                    <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
                      <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm truncate">
                        {generatedBlog.title}
                      </h3>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto p-3">
                      {isEditMode ? (
                        <textarea
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          placeholder="Edit your blog content..."
                          maxLength={50000}
                          className="w-full h-full min-h-full bg-transparent text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none resize-none text-sm leading-relaxed"
                          aria-label="Edit blog content"
                        />
                      ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <div className="whitespace-pre-wrap text-neutral-700 dark:text-neutral-300 text-sm leading-relaxed break-words">
                            {generatedBlog.content}
                          </div>
                        </div>
                      )}
                    </div>
                    {isEditMode && (
                      <div className="px-3 py-2 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setIsEditMode(false);
                            setEditedContent('');
                          }}
                          className="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            setGeneratedBlog({ ...generatedBlog, content: editedContent });
                            setIsEditMode(false);
                          }}
                          className="px-3 py-1.5 text-xs bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded font-medium transition-colors"
                        >
                          Save
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Action buttons - full width on mobile */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 shrink-0">
                    <button
                      onClick={handleViewBlog}
                      className="w-full sm:flex-1 min-h-[48px] px-6 bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800 hover:from-neutral-700 hover:via-neutral-600 hover:to-neutral-700 dark:from-neutral-200 dark:via-neutral-300 dark:to-neutral-200 text-white dark:text-neutral-900 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-neutral-500/20 text-sm"
                    >
                      Open in Editor
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleReset}
                      className="w-full sm:flex-1 min-h-[48px] px-6 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-lg transition-all text-sm"
                    >
                      Record Another
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* PERMISSION DENIED STATE - helpful instructions */}
          {viewState === 'permission-denied' && (
            <>
              <div className="lg:col-span-2 order-1 animate-in fade-in duration-300">
                <div className="max-w-md mx-auto text-center">
                  <div className="mb-6 flex justify-center">
                    <div className="w-16 h-16 bg-error-100 dark:bg-error-900/30 rounded-full flex items-center justify-center">
                      <MicOff className="w-8 h-8 text-error-600 dark:text-error-400" />
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
                    {state.permissionState === 'not-allowed' ? 'No Microphone Found' : 'Microphone Access Required'}
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-8">
                    {state.permissionState === 'not-allowed'
                      ? 'We couldn\'t find a microphone on your device. Please connect a microphone and try again.'
                      : 'To record audio, you need to grant microphone permission to VoiceDraft.'}
                  </p>

                  {state.permissionState === 'denied' && (
                    <div className="bg-neutral-100 dark:bg-neutral-900 rounded-xl p-5 mb-6 text-left">
                      <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        How to enable microphone access:
                      </h3>
                      <ol className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                        <li className="flex gap-3">
                          <span className="flex-shrink-0 w-5 h-5 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center text-xs font-semibold">1</span>
                          <span>Click the lock or info icon in your browser's address bar</span>
                        </li>
                        <li className="flex gap-3">
                          <span className="flex-shrink-0 w-5 h-5 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center text-xs font-semibold">2</span>
                          <span>Find "Microphone" in the permission settings</span>
                        </li>
                        <li className="flex gap-3">
                          <span className="flex-shrink-0 w-5 h-5 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center text-xs font-semibold">3</span>
                          <span>Change the setting to "Allow"</span>
                        </li>
                        <li className="flex gap-3">
                          <span className="flex-shrink-0 w-5 h-5 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center text-xs font-semibold">4</span>
                          <span>Refresh this page and try again</span>
                        </li>
                      </ol>
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => {
                        setViewState('idle');
                      }}
                      className="w-full min-h-[52px] px-6 bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800 hover:from-neutral-700 hover:via-neutral-600 hover:to-neutral-700 dark:from-neutral-200 dark:via-neutral-300 dark:to-neutral-200 text-white dark:text-neutral-900 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-neutral-500/20"
                    >
                      <RefreshCw className="w-5 h-5" />
                      Try Again
                    </button>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {state.permissionState === 'not-allowed'
                        ? 'Make sure your microphone is properly connected'
                        : 'Enable microphone permission in your browser settings, then click the microphone button'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ERROR STATE - clean, helpful */}
          {viewState === 'error' && (
            <>
              <div className="lg:col-span-2 order-1 animate-in fade-in duration-300">
                <div className="max-w-md mx-auto text-center" role="alert" aria-live="assertive">
                  <div className="mb-6 flex justify-center">
                    <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-900 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-neutral-900 dark:text-neutral-100" />
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
                    Something went wrong
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-8">
                    {errorMessage}
                  </p>

                  <div className="flex flex-col gap-3">
                    {transcript ? (
                      <button
                        onClick={handleRetryGeneration}
                        className="w-full min-h-[52px] px-6 bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800 hover:from-neutral-700 hover:via-neutral-600 hover:to-neutral-700 dark:from-neutral-200 dark:via-neutral-300 dark:to-neutral-200 text-white dark:text-neutral-900 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-neutral-500/20"
                      >
                        <RefreshCw className="w-5 h-5" />
                        Retry Generation
                      </button>
                    ) : (
                      <button
                        onClick={handleReset}
                        className="w-full min-h-[52px] px-6 bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800 hover:from-neutral-700 hover:via-neutral-600 hover:to-neutral-700 dark:from-neutral-200 dark:via-neutral-300 dark:to-neutral-200 text-white dark:text-neutral-900 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-neutral-500/20"
                      >
                        <RefreshCw className="w-5 h-5" />
                        Try Again
                      </button>
                    )}
                    {transcript && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Your transcript is saved. You can retry with adjusted options.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Session Expired State */}
          {viewState === 'session-expired' && (
            <>
              <div className="lg:col-span-2 order-1 animate-in fade-in duration-300">
                <div className="max-w-md mx-auto text-center" role="alert" aria-live="assertive">
                  <div className="mb-6 flex justify-center">
                    <div className="w-16 h-16 bg-error-100 dark:bg-error-900/30 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-error-600 dark:text-error-400" />
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
                    Session Expired
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-2">
                    {sessionError || 'Your session has expired. Please sign in again to continue.'}
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-8">
                    This prevents wasting transcription credits on an expired session.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => router.push('/auth/signin')}
                      className="w-full sm:w-auto min-h-[52px] px-8 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 hover:from-primary-500 hover:via-primary-400 hover:to-primary-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => router.push('/auth/signup')}
                      className="w-full sm:w-auto min-h-[52px] px-8 bg-gradient-to-r from-neutral-100 via-neutral-50 to-neutral-100 dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-800 hover:from-neutral-200 hover:via-neutral-100 hover:to-neutral-200 dark:hover:from-neutral-700 dark:hover:via-neutral-600 dark:hover:to-neutral-700 text-neutral-900 dark:text-neutral-100 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      Create Account
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
    </WithBottomNav>
  );
}
