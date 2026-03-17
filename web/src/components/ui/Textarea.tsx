import React, { useId } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  autoResize?: boolean;
  maxLength?: number;
  showCharacterCount?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      autoResize = false,
      maxLength,
      showCharacterCount = false,
      className,
      id,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;
    const charCountId = `${textareaId}-charcount`;

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoResize) {
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
      }
      onChange?.(e);
    };

    const characterCount = typeof value === 'string' ? value.length : 0;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={textareaId}
              className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              {label}
            </label>
            {showCharacterCount && maxLength && (
              <span
                id={charCountId}
                className="text-xs text-neutral-500 dark:text-neutral-400"
              >
                {characterCount} / {maxLength}
              </span>
            )}
          </div>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          value={value}
          onChange={handleInputChange}
          maxLength={maxLength}
          aria-describedby={
            error ? errorId : helperText ? helperId : showCharacterCount ? charCountId : undefined
          }
          aria-invalid={error ? 'true' : undefined}
          className={cn(
            'w-full rounded-xl border px-4 py-3',
            'bg-white dark:bg-neutral-900',
            'text-neutral-900 dark:text-neutral-100',
            'placeholder:text-neutral-400',
            'border-neutral-300 dark:border-neutral-700',
            'hover:border-neutral-400 dark:hover:border-neutral-600',
            'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
            'focus:outline-none',
            'transition-colors duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'resize-y',
            'min-h-[80px]',
            error && 'border-accent-500 focus:border-accent-500 focus:ring-accent-500/20',
            autoResize && 'overflow-hidden',
            className
          )}
          {...props}
        />

        {error && (
          <p id={errorId} className="text-sm text-accent-500">
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

Textarea.displayName = 'Textarea';
