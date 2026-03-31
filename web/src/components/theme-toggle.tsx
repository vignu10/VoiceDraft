'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './theme-provider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 shadow-sm transition-colors hover:bg-neutral-200 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
      aria-label="Toggle theme"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5" />
      ) : theme === 'light' ? (
        <Moon className="h-5 w-5" />
      ) : (
        <>
          <Sun className="h-5 w-5 rotate-90 scale-0 absolute transition-transform" />
          <Moon className="h-5 w-5" />
        </>
      )}
    </button>
  );
}
