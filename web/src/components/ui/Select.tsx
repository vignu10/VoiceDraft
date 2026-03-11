'use client';

import React, { useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  className,
}) => {
  const generatedId = useId();
  const selectId = `select-${generatedId}`;
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayedValue = selectedOption?.label || placeholder;

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        setIsOpen(!isOpen);
        break;
      case 'Escape':
        setIsOpen(false);
        buttonRef.current?.focus();
        break;
      case 'ArrowDown':
        if (!isOpen) {
          e.preventDefault();
          setIsOpen(true);
        }
        break;
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const getListboxProps = () => ({
    role: 'listbox',
    'aria-labelledby': selectId,
    'aria-activedescendant': value ? `${selectId}-option-${value}` : undefined,
  });

  return (
    <div className={cn('flex flex-col gap-1.5', className)} ref={selectRef}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <button
          ref={buttonRef}
          id={selectId}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-invalid={error ? 'true' : undefined}
          className={cn(
            'w-full flex items-center justify-between',
            'rounded-xl border px-4 py-2.5',
            'bg-white dark:bg-neutral-900',
            'text-neutral-900 dark:text-neutral-100',
            'border-neutral-300 dark:border-neutral-700',
            'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
            'focus:outline-none',
            'transition-colors duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-accent-500 focus:border-accent-500 focus:ring-accent-500/20'
          )}
        >
          <span className={cn(!value && 'text-neutral-400')}>
            {displayedValue}
          </span>
          <svg
            className={cn(
              'h-4 w-4 text-neutral-400 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {isOpen && (
          <ul
            ref={listboxRef}
            className={cn(
              'absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-xl',
              'bg-white dark:bg-neutral-900',
              'border border-neutral-200 dark:border-neutral-800',
              'shadow-lg',
              'py-1'
            )}
            {...getListboxProps()}
          >
            {options.map((option) => (
              <li
                key={option.value}
                id={`${selectId}-option-${option.value}`}
                role="option"
                aria-selected={value === option.value}
                onClick={() => !option.disabled && handleSelect(option.value)}
                className={cn(
                  'px-4 py-2.5 cursor-pointer',
                  'transition-colors duration-150',
                  'text-neutral-900 dark:text-neutral-100',
                  option.disabled && 'opacity-50 cursor-not-allowed',
                  !option.disabled && 'hover:bg-primary-50 dark:hover:bg-primary-950',
                  value === option.value && 'bg-primary-100 dark:bg-primary-900 font-medium'
                )}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
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
