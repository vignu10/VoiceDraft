'use client';

import { useState, useEffect } from 'react';
import { Mic, FileText, TrendingUp, Check, X, AlertCircle, RefreshCw, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type Step = 'transcribing' | 'generating' | 'complete' | 'error';

interface TranscribingScreenProps {
  step: Step;
  transcript?: string;
  generatedBlog?: {
    title: string;
    content: string;
    wordCount?: number;
  };
  error?: string | null;
  onRetry?: () => void;
  onCancel?: () => void;
  onContinue?: () => void;
}

const PROCESSING_MESSAGES = {
  transcribing: [
    'Converting your voice to text...',
    'Analyzing speech patterns...',
    'Capturing your words...',
  ],
  generating: [
    'Structuring your blog post...',
    'Polishing the content...',
    'Adding finishing touches...',
  ],
};

const STEP_TITLES = {
  transcribing: 'Transcribing your audio',
  generating: 'Generating your blog post',
  complete: 'All done!',
  error: 'Something went wrong',
};

export function TranscribingScreen({
  step,
  transcript,
  generatedBlog,
  error,
  onRetry,
  onCancel,
  onContinue,
}: TranscribingScreenProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  // Rotate processing messages
  useEffect(() => {
    if (step === 'error' || step === 'complete') return;

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % PROCESSING_MESSAGES[step].length);
    }, 2500);

    return () => clearInterval(interval);
  }, [step]);

  const getStepStatus = (targetStep: Step): 'complete' | 'active' | 'pending' | 'error' => {
    const order: Step[] = ['transcribing', 'generating', 'complete'];
    const currentIndex = order.indexOf(step);
    const targetIndex = order.indexOf(targetStep);

    if (step === 'error') {
      return targetIndex <= order.indexOf('transcribing') ? 'error' : 'pending';
    }
    if (targetIndex < currentIndex) return 'complete';
    if (targetIndex === currentIndex) return 'active';
    return 'pending';
  };

  const StepIndicator = ({
    label,
    targetStep,
    icon: Icon,
  }: {
    label: string;
    targetStep: Step;
    icon: React.ComponentType<{ className?: string }>;
  }) => {
    const status = getStepStatus(targetStep);

    const getBgColor = () => {
      switch (status) {
        case 'complete':
          return 'bg-success-500';
        case 'active':
          return 'bg-white/20';
        case 'error':
          return 'bg-error-500';
        default:
          return 'bg-white/10';
      }
    };

    const getTextColor = () => {
      switch (status) {
        case 'complete':
        case 'active':
          return 'text-white font-medium';
        default:
          return 'text-white/70 font-medium';
      }
    };

    return (
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getBgColor()} shadow-sm`}>
          {status === 'complete' && <Check className="w-5 h-5 text-white" />}
          {status === 'active' && (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          {status === 'error' && <X className="w-5 h-5 text-white" />}
          {status === 'pending' && <Icon className="w-5 h-5 text-white/50" />}
        </div>
        <span className={`text-sm ${getTextColor()}`}>{label}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-violet-900 via-violet-800 to-fuchsia-900" role="dialog" aria-modal="true" aria-labelledby="transcribing-title">
      {/* Animated background orbs */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary-400/30 rounded-full blur-3xl animate-float" aria-hidden="true" />
      <div className="absolute bottom-0 right-0 w-48 h-48 bg-accent-300/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '-2s' }} aria-hidden="true" />
      <div className="absolute top-1/2 right-0 w-32 h-32 bg-success-300/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '-4s' }} aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-lg mx-auto px-6">
        {/* Icon container with pulse animation for active states */}
        <div className="mb-8">
          <div className={`relative mx-auto w-28 h-28 rounded-xl flex items-center justify-center shadow-2xl transition-opacity duration-500 ${
            step === 'error'
              ? 'bg-error-500/20'
              : step === 'complete'
              ? 'bg-success-500/20'
              : step === 'generating'
              ? 'bg-accent-500/20'
              : 'bg-primary-500/20'
          } ${step === 'transcribing' || step === 'generating' ? 'animate-pulse-gentle' : ''}`}>
            {/* Inner glow */}
            <div className={`absolute inset-2 rounded-xl opacity-50 ${
              step === 'error'
                ? 'bg-error-500/30'
                : step === 'complete'
                ? 'bg-success-500/30'
                : step === 'generating'
                ? 'bg-accent-500/30'
                : 'bg-primary-500/30'
            }`} aria-hidden="true" />

            {step === 'error' ? (
              <AlertCircle className="w-14 h-14 text-error-400" aria-hidden="true" />
            ) : step === 'complete' ? (
              <Check className="w-14 h-14 text-success-400" aria-hidden="true" />
            ) : step === 'generating' ? (
              <Sparkles className="w-14 h-14 text-accent-300 animate-spin-slow" aria-hidden="true" />
            ) : (
              <Mic className="w-14 h-14 text-primary-300" aria-hidden="true" />
            )}
          </div>
        </div>

        {/* Title with better typography */}
        <h3 id="transcribing-title" className="text-white text-3xl font-bold text-center mb-3 tracking-tight">
          {STEP_TITLES[step]}
        </h3>

        {/* Processing message with better styling */}
        {step !== 'error' && step !== 'complete' && (
          <p className="text-violet-200 text-base text-center mb-8 font-medium" aria-live="polite" aria-atomic="true">
            {PROCESSING_MESSAGES[step][messageIndex]}
          </p>
        )}

        {/* Step indicators with improved design */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8 border border-white/10 shadow-2xl" role="list" aria-label="Processing steps">
          <div className="space-y-5">
            <StepIndicator label="Transcribing audio" targetStep="transcribing" icon={Mic} />
            <div className="w-0.5 h-7 bg-gradient-to-b from-violet-300/50 to-transparent ml-5" aria-hidden="true" />
            <StepIndicator label="Generating blog post" targetStep="generating" icon={FileText} />
            <div className="w-0.5 h-7 bg-gradient-to-b from-violet-300/50 to-transparent ml-5" aria-hidden="true" />
            <StepIndicator label="Ready to view" targetStep="complete" icon={TrendingUp} />
          </div>
        </div>

        {/* Error message with improved design */}
        {error && step === 'error' && (
          <div className="bg-error-500/20 border border-error-400/40 rounded-xl p-5 mb-8 backdrop-blur-sm" role="alert">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-error-300 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-error-100 text-sm leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Transcript preview with improved design */}
        {transcript && step !== 'error' && (
          <div className="bg-violet-950/60 border border-violet-400/30 rounded-xl p-5 mb-6 backdrop-blur-sm">
            <p className="text-violet-300 text-xs mb-3 font-semibold tracking-wide uppercase">Your Transcript</p>
            <p className="text-white text-sm leading-relaxed line-clamp-4">
              {transcript}
            </p>
          </div>
        )}

        {/* Generated blog preview with improved design */}
        {generatedBlog && (step === 'generating' || step === 'complete') && (
          <div className="bg-success-950/60 border border-success-400/40 rounded-xl p-5 mb-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-success-400 rounded-full animate-pulse" aria-hidden="true" />
              <p className="text-success-300 text-xs font-semibold tracking-wide uppercase">Blog Post Ready</p>
            </div>
            <p className="text-white text-lg font-bold mb-2">{generatedBlog.title}</p>
            <div className="flex items-center gap-3 text-success-200 text-xs">
              <span>{generatedBlog.wordCount} words</span>
              <span className="w-1 h-1 bg-success-400/50 rounded-full" aria-hidden="true" />
              <span>Ready to edit</span>
            </div>
          </div>
        )}

        {/* Action buttons with improved design */}
        {step === 'error' && (
          <div className="flex gap-3">
            <Button
              onClick={onCancel}
              variant="secondary"
              className="flex-1 !bg-white/10 hover:!bg-white/20 !text-white !border-white/10 backdrop-blur-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={onRetry}
              variant="primary"
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Try Again
            </Button>
          </div>
        )}

        {/* View Blog button - show immediately when generation is complete */}
        {generatedBlog && onContinue && (step === 'generating' || step === 'complete') && (
          <Button
            onClick={onContinue}
            fullWidth
            size="lg"
            className="!bg-gradient-to-r !from-success-500 !to-emerald-500 hover:!from-success-600 hover:!to-emerald-600 !shadow-lg !shadow-success-500/30 hover:!shadow-xl hover:!shadow-success-500/40"
          >
            View Blog Post
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </Button>
        )}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -20px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        @keyframes pulse-gentle {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        .animate-pulse-gentle {
          animation: pulse-gentle 3s ease-in-out infinite;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
}
