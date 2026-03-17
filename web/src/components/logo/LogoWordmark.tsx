'use client';

import React from 'react';

interface LogoWordmarkProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTagline?: boolean;
}

const sizeStyles = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl',
  xl: 'text-6xl'
};

const taglineSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg'
};

export const LogoWordmark: React.FC<LogoWordmarkProps> = ({
  size = 'md',
  className = '',
  showTagline = false
}) => {
  return (
    <div className={`flex flex-col ${className}`}>
      <div className={`font-bold tracking-tight ${sizeStyles[size]}`}>
        <span className="text-neutral-900 dark:text-neutral-100">Voice</span>
        <span className="text-primary-600 dark:text-primary-400 ml-1">Draft</span>
      </div>
      {showTagline && (
        <p className={`text-neutral-500 dark:text-neutral-400 mt-1 ${taglineSizes[size]}`}>
          Voice to blog, powered by AI
        </p>
      )}
    </div>
  );
};
