'use client';

import React, { useId } from 'react';
import { cn } from '@/lib/utils';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  label?: string;
  error?: string;
  helperText?: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  disabled?: boolean;
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  label,
  error,
  helperText,
  options,
  value,
  onChange,
  orientation = 'vertical',
  disabled = false,
  className,
}) => {
  const generatedId = useId();
  const groupId = `radio-group-${generatedId}`;
  const errorId = `${groupId}-error`;
  const helperId = `${groupId}-helper`;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && (
        <label
          id={groupId}
          className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          {label}
        </label>
      )}

      <div
        role="radiogroup"
        aria-labelledby={label ? groupId : undefined}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        aria-invalid={error ? 'true' : undefined}
        className={cn(
          'flex gap-3',
          orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'
        )}
      >
        {options.map((option) => {
          const optionId = `${name}-${option.value}`;
          const isSelected = value === option.value;
          const isDisabled = disabled || option.disabled;

          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={cn(
                'relative flex items-start gap-3',
                'p-3 rounded-xl border cursor-pointer',
                'transition-all duration-200',
                'bg-white dark:bg-neutral-900',
                'border-neutral-200 dark:border-neutral-800',
                'hover:border-primary-300 dark:hover:border-primary-700',
                isSelected && 'border-primary-500 ring-2 ring-primary-500/20',
                isDisabled && 'opacity-50 cursor-not-allowed hover:border-neutral-200',
                orientation === 'horizontal' && 'flex-1 min-w-[150px]'
              )}
            >
              <input
                id={optionId}
                type="radio"
                name={name}
                value={option.value}
                checked={isSelected}
                onChange={() => !isDisabled && onChange?.(option.value)}
                disabled={isDisabled}
                className={cn(
                  'mt-0.5 h-4 w-4',
                  'cursor-pointer',
                  'text-primary-500 focus:ring-primary-500',
                  'border-neutral-300'
                )}
              />

              <div className="flex flex-col">
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {option.label}
                </span>
                {option.description && (
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {option.description}
                  </span>
                )}
              </div>
            </label>
          );
        })}
      </div>

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
};
