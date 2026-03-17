'use client';

import React from 'react';

interface LogoIconProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export const LogoIcon: React.FC<LogoIconProps> = ({
  size = 128,
  className = '',
  animate = false
}) => {
  // Animation styles
  const animationClass = animate ? 'animate-pulse-glow' : '';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 480 480"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${animationClass}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#AFA9EC"/>
          <stop offset="50%" stopColor="#9FE1CB"/>
          <stop offset="100%" stopColor="#5DCAA5"/>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect x="0" y="0" width="480" height="480" rx="108" fill="#121210"/>

      {/* Sound wave bars */}
      <g transform="translate(68, 112)" filter={animate ? "url(#glow)" : undefined}>
        <rect x="0"   y="50" width="14" height="64" rx="7" fill="url(#waveGrad)" opacity="0.55"/>
        <rect x="32"  y="24" width="14" height="116" rx="7" fill="url(#waveGrad)" opacity="0.70"/>
        <rect x="64"  y="0"  width="14" height="164" rx="7" fill="url(#waveGrad)" opacity="0.85"/>
        <rect x="96"  y="16" width="14" height="132" rx="7" fill="url(#waveGrad)" opacity="0.80"/>
        <rect x="128" y="40" width="14" height="84"  rx="7" fill="url(#waveGrad)" opacity="0.60"/>
      </g>

      {/* Arrow */}
      <path d="M236 240 L256 240" stroke="#9FE1CB" strokeWidth="5" strokeLinecap="round" opacity="0.5"/>
      <path d="M252 232 L262 240 L252 248" stroke="#9FE1CB" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.5"/>

      {/* Text lines */}
      <g transform="translate(278, 130)">
        <rect x="0" y="0"   width="124" height="10" rx="5" fill="#EEEDFE" opacity="0.85"/>
        <rect x="0" y="32"  width="94"  height="10" rx="5" fill="#CECBF6" opacity="0.65"/>
        <rect x="0" y="64"  width="112" height="10" rx="5" fill="#CECBF6" opacity="0.55"/>
        <rect x="0" y="96"  width="72"  height="10" rx="5" fill="#AFA9EC" opacity="0.45"/>
        <rect x="0" y="128" width="124" height="10" rx="5" fill="#CECBF6" opacity="0.60"/>
        <rect x="0" y="160" width="86"  height="10" rx="5" fill="#AFA9EC" opacity="0.40"/>
      </g>
    </svg>
  );
};
