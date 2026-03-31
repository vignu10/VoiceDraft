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
  default: 'bg-frosted border-neutral-200/50 dark:border-neutral-800/50',
  draft: 'bg-frosted border-neutral-300/50 dark:border-neutral-700/50',
  featured: 'bg-gradient-card border-neutral-400/50 dark:border-neutral-600/50',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', interactive = false, className, children, onClick }, ref) => {
    return (
      <div
        ref={ref}
        onClick={onClick}
        tabIndex={interactive ? 0 : undefined}
        role={interactive ? 'button' : undefined}
        className={cn(
          'rounded-2xl border shadow-sm',
          'transition-transform transition-shadow duration-200 ease-out',
          variantStyles[variant],
          interactive && 'cursor-pointer hover:shadow-lg hover:-translate-y-1 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
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
  <div className={cn('px-4 sm:px-6 pb-4 sm:pb-6 pt-0 border-t border-neutral-200/50 dark:border-neutral-800/50', className)}>
    {children}
  </div>
);
