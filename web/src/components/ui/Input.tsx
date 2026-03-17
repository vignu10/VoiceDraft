import React, { useId } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            aria-invalid={error ? 'true' : undefined}
            className={cn(
              'w-full rounded-xl border px-4 py-2.5',
              'bg-white dark:bg-neutral-900',
              'text-neutral-900 dark:text-neutral-100',
              'placeholder:text-neutral-400',
              'border-neutral-300 dark:border-neutral-700',
              'hover:border-neutral-400 dark:hover:border-neutral-600',
              'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
              'focus:outline-none',
              'transition-colors duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-accent-500 focus:border-accent-500 focus:ring-accent-500/20',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p id={errorId} className="text-sm text-accent-500" role="alert" aria-live="polite">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={helperId} className="text-sm text-neutral-500 dark:text-neutral-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
