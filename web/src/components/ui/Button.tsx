import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'danger-outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  href?: string;
  children: React.ReactNode;
}

const variantStyles = {
  primary: 'bg-gradient-to-r from-neutral-800 via-neutral-900 to-neutral-800 text-white hover:from-neutral-700 hover:via-neutral-800 hover:to-neutral-700 hover:-translate-y-0.5 hover:shadow-xl dark:from-neutral-200 dark:via-neutral-100 dark:to-neutral-200 dark:text-neutral-900 shadow-lg',
  secondary: 'bg-gradient-to-r from-neutral-100 via-neutral-50 to-neutral-100 text-neutral-900 hover:from-neutral-200 hover:via-neutral-100 hover:to-neutral-200 hover:-translate-y-0.5 active:from-neutral-300 active:via-neutral-200 active:to-neutral-300 active:translate-y-0 dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-800 dark:text-neutral-100 dark:hover:shadow-lg',
  danger: 'bg-gradient-to-r from-neutral-700 via-neutral-800 to-neutral-700 text-white hover:from-neutral-600 hover:via-neutral-700 hover:to-neutral-600 hover:-translate-y-0.5 hover:shadow-xl dark:from-neutral-300 dark:via-neutral-200 dark:to-neutral-300 dark:text-neutral-900 shadow-lg',
  ghost: 'bg-transparent text-neutral-800 hover:bg-neutral-100 active:bg-neutral-200 dark:text-neutral-200 dark:hover:bg-neutral-800',
  'danger-outline': 'bg-transparent text-neutral-700 border border-neutral-700 hover:bg-neutral-100 hover:-translate-y-0.5 active:bg-neutral-200 active:translate-y-0 dark:text-neutral-300 dark:border-neutral-300 dark:hover:bg-neutral-800',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm font-semibold',
  md: 'px-4 py-2 text-base font-semibold',
  lg: 'px-6 py-3 text-lg font-semibold',
};

const loadingSpinner = (
  <svg
    className="animate-spin h-4 w-4"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      disabled,
      href,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = cn(
      'inline-flex items-center justify-center gap-2 rounded-xl',
      'transition-all duration-200 ease-out',
      'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'active:scale-95',
      variantStyles[variant],
      sizeStyles[size],
      fullWidth && 'w-full',
      className
    );

    const content = (
      <>
        {isLoading && loadingSpinner}
        {children}
      </>
    );

    if (href) {
      return (
        <Link
          href={href}
          className={baseClasses}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={baseClasses}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';
