'use client';

import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface WaveformVisualizerProps {
  isRecording: boolean;
  audioLevel: number;
  duration: number;
  className?: string;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  isRecording,
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
    if (!isRecording) {
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

        // Create gradient
        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, 'oklch(0.60 0.24 285)');
        gradient.addColorStop(1, 'oklch(0.45 0.26 285)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, height, 4);
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
  }, [isRecording, audioLevel]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      {/* Duration display */}
      <div className="text-4xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
        {formatDuration(duration)}
      </div>

      {/* Canvas waveform */}
      <canvas
        ref={canvasRef}
        className="w-full h-24"
        style={{ imageRendering: 'crisp-edges' }}
      />

      {/* Audio level indicator */}
      <div className="w-full max-w-xs h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden mt-4">
        <div
          className="h-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-75 ease-out"
          style={{ width: `${audioLevel}%` }}
        />
      </div>
    </div>
  );
};
