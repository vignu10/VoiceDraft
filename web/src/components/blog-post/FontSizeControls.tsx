'use client';

import { useEffect, useState } from 'react';

export type FontSize = 'small' | 'medium' | 'large';

const FONT_SIZES = {
  small: 'prose-sm',
  medium: 'prose',
  large: 'prose-lg',
} as const;

const STORAGE_KEY = 'voicedraft-font-size';

export function useFontSize() {
  const [fontSize, setFontSizeState] = useState<FontSize>('medium');

  useEffect(() => {
    // Load from localStorage on mount
    const stored = localStorage.getItem(STORAGE_KEY) as FontSize;
    if (stored && (stored === 'small' || stored === 'medium' || stored === 'large')) {
      setFontSizeState(stored);
    }
  }, []);

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem(STORAGE_KEY, size);
  };

  return { fontSize, setFontSize };
}

interface FontSizeControlsProps {
  fontSize: FontSize;
  onFontSizeChange: (size: FontSize) => void;
}

export function FontSizeControls({ fontSize, onFontSizeChange }: FontSizeControlsProps) {
  const sizes: { key: FontSize; label: string; indicator: string }[] = [
    { key: 'small', label: 'Small', indicator: 'A' },
    { key: 'medium', label: 'Medium', indicator: 'A⁺' },
    { key: 'large', label: 'Large', indicator: 'A⁺⁺' },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Size</span>
      <div className="flex items-center rounded-lg border border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-800">
        {sizes.map((size) => (
          <button
            key={size.key}
            onClick={() => onFontSizeChange(size.key)}
            aria-label={size.label}
            aria-pressed={fontSize === size.key}
            title={size.label}
            className={`px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 ${
              fontSize === size.key
                ? 'bg-accent text-white'
                : 'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-700'
            }`}
          >
            {size.indicator}
          </button>
        ))}
      </div>
    </div>
  );
}

export function getProseClass(fontSize: FontSize): string {
  return FONT_SIZES[fontSize];
}
