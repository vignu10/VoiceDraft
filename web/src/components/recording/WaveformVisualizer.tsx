'use client';

import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface WaveformVisualizerProps {
  isRecording: boolean;
  isPaused?: boolean;
  audioLevel: number;
  duration: number;
  className?: string;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  isRecording,
  isPaused = false,
  audioLevel,
  duration,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const barsRef = useRef<number[]>([]);

  // Initialize bars
  useEffect(() => {
    const barCount = 40;
    barsRef.current = Array.from({ length: barCount }, () => Math.random() * 50 + 10);
  }, []);

  // Animate waveform
  useEffect(() => {
    if (!isRecording || isPaused) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const barCount = barsRef.current.length;
    const barWidth = (rect.width - barCount * 4) / barCount;
    const maxHeight = rect.height * 0.8;

    const animate = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, rect.width, rect.height);

      // Update bars based on audio level
      const levelFactor = audioLevel / 100;

      barsRef.current.forEach((baseHeight, i) => {
        // Add some randomness for visual interest
        const variation = Math.sin(Date.now() / 200 + i * 0.3) * 0.3 + 0.7;
        const height = Math.max(4, baseHeight * levelFactor * variation * (maxHeight / 50));

        const x = i * (barWidth + 4);
        const y = (rect.height - height) / 2;

        // Clean neutral fill with dark mode support
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        ctx.fillStyle = isDark ? 'rgb(255, 255, 255)' : 'rgb(24, 24, 24)';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, height, 2);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, isPaused, audioLevel]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      {/* Canvas waveform */}
      <canvas
        ref={canvasRef}
        className="w-full h-20"
        style={{ imageRendering: 'crisp-edges' }}
      />

      {/* Audio level indicator - clean, minimalist */}
      <div className="w-full max-w-xs h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden mt-3">
        <div
          className="h-full bg-neutral-900 dark:bg-neutral-100 transition-colors duration-75 ease-out"
          style={{ width: `${audioLevel}%` }}
        />
      </div>
    </div>
  );
};
