'use client';

import { useEffect, useState } from 'react';

interface TranscribingScreenProps {
  progress?: number;
  transcript?: string;
}

export function TranscribingScreen({ progress = 0, transcript }: TranscribingScreenProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDisplayProgress((prev) => {
        if (prev >= 95) return 95;
        return prev + Math.random() * 3;
      });
    }, 500);

    return () => clearInterval(timer);
  }, []);

  const finalProgress = transcript ? 100 : displayProgress;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-cyan-900 via-cyan-800 to-teal-900">
      {/* Floating orbs */}
      <div
        className="absolute top-0 left-0 w-64 h-64 bg-cyan-400/30 rounded-full blur-3xl animate-float"
        style={{ animationDelay: '0s' }}
      />
      <div
        className="absolute bottom-0 right-0 w-48 h-48 bg-cyan-300/30 rounded-full blur-3xl animate-float"
        style={{ animationDelay: '-2s' }}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/15 to-teal-500/15" />

      {/* Content */}
      <div className="relative z-10 text-center max-w-lg mx-auto px-6">
        {/* Mic icon with glow */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.5)]">
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="8" y="4" width="8" height="12" rx={4} />
              <path d="M6 16a4 4 0 0 0 12 0" strokeLinecap="round" />
              <line x1="12" y1="16" x2="12" y2="20" strokeLinecap="round" />
            </svg>
          </div>

          {/* Sound wave bars */}
          <div className="flex justify-center gap-1.5 h-10 items-center">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-white rounded-full animate-sound-bar"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>

        {/* Status text */}
        <h3 className="text-white text-2xl font-semibold mb-2">Transcribing your audio...</h3>
        <p className="text-cyan-100 text-sm">This usually takes about 30 seconds</p>

        {/* Progress bar */}
        <div className="max-w-[300px] mx-auto mt-6">
          <div className="flex justify-between text-cyan-50 text-sm mb-2">
            <span>Processing</span>
            <span>{Math.round(finalProgress)}%</span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-400 rounded-full animate-progress-shimmer"
              style={{ width: `${finalProgress}%` }}
            />
          </div>
        </div>

        {/* Live transcript preview */}
        <div className="max-w-[500px] mx-auto mt-6">
          <div className="bg-cyan-950/50 border border-cyan-400/20 rounded-lg p-4 text-left">
            <p className="text-cyan-200 text-xs mb-2 font-medium">LIVE TRANSCRIPT</p>
            <p className="text-white text-base leading-relaxed">
              {transcript || (
                <span className="animate-pulse">Processing your voice recording...</span>
              )}
            </p>
          </div>
        </div>

        {/* Processing steps */}
        <div className="flex justify-center gap-3 flex-wrap mt-6">
          {/* Audio uploaded - complete */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full">
            <svg className="w-4 h-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010-1.414l-8 8a1 1 0 01-1.414 0l-8-8a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 1.414l-8 8a1 1 0 01-1.414 0l-4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-cyan-50 text-sm">Audio uploaded</span>
          </div>

          {/* Transcribing - in progress or complete */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full">
            {transcript ? (
              <svg className="w-4 h-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010-1.414l-8 8a1 1 0 01-1.414 0l-8-8a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 1.414l-8 8a1 1 0 01-1.414 0l-4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <div className="w-4 h-4 border-2 border-white/30 border-t-transparent rounded-full animate-spin" />
            )}
            <span className="text-cyan-50 text-sm">Transcribing</span>
          </div>

          {/* Generating - pending or in progress */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full">
            {transcript ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-transparent rounded-full animate-spin" />
            ) : (
              <div className="w-4 h-4 border-2 border-white/20 border-t-transparent rounded-full" />
            )}
            <span className="text-cyan-50 text-sm">Generating</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -20px); }
        }
        @keyframes sound-bar {
          0%, 100% { height: 8px; }
          50% { height: 32px; }
        }
        @keyframes progress-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-sound-bar {
          animation: sound-bar 0.6s ease-in-out infinite;
        }
        .animate-progress-shimmer {
          background-size: 200% 100%;
          animation: progress-shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
