import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps {
  variant?: 'default' | 'draft' | 'featured';
  interactive?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

const variantStyles = {
  default: 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800',
  draft: 'bg-white dark:bg-neutral-900 border-primary-200 dark:border-primary-800',
  featured: 'bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-950 dark:to-accent-950 border-primary-300 dark:border-primary-700',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', interactive = false, className, children, onClick }, ref) => {
    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          'rounded-2xl border shadow-sm',
          'transition-all duration-200 ease-out',
          variantStyles[variant],
          interactive && 'cursor-pointer hover:shadow-lg hover:-translate-y-1 active:scale-[0.98]',
          className
        )}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children,
}) => (
  <div className={cn('p-4 sm:p-6', className)}>{children}</div>
);

export const CardBody: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children,
}) => (
  <div className={cn('px-4 sm:px-6 pb-4 sm:pb-6', className)}>{children}</div>
);

export const CardFooter: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children,
}) => (
  <div className={cn('px-4 sm:px-6 pb-4 sm:pb-6 pt-0 border-t border-neutral-100 dark:border-neutral-800', className)}>
    {children}
  </div>
);
