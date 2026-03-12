import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-neutral-200 dark:bg-neutral-800',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-md',
        variant === 'rounded' && 'rounded-xl',
        variant === 'text' && 'rounded h-4 w-full',
        className
      )}
      style={{ width, height }}
      {...props}
    />
  );
}

// Draft card skeleton
export function DraftCardSkeleton() {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5">
      <div className="flex items-start justify-between mb-3">
        <Skeleton variant="rounded" className="h-10 w-10" />
        <Skeleton variant="text" width="80px" />
      </div>
      <Skeleton variant="text" className="h-6 w-3/4 mb-2" />
      <Skeleton variant="text" className="h-4 w-full mb-1" />
      <Skeleton variant="text" className="h-4 w-2/3 mb-4" />
      <div className="flex items-center justify-between">
        <Skeleton variant="text" width="100px" />
        <div className="flex gap-2">
          <Skeleton variant="rounded" className="h-8 w-8" />
          <Skeleton variant="rounded" className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}

// Blog card skeleton
export function BlogCardSkeleton() {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      <Skeleton variant="rectangular" className="h-48 w-full" />
      <div className="p-5">
        <Skeleton variant="text" className="h-6 w-3/4 mb-2" />
        <Skeleton variant="text" className="h-4 w-full mb-1" />
        <Skeleton variant="text" className="h-4 w-2/3 mb-4" />
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" className="h-8 w-8" />
          <Skeleton variant="text" width="120px" />
        </div>
      </div>
    </div>
  );
}

// User profile skeleton
export function UserProfileSkeleton() {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
      <div className="flex items-start gap-6">
        <Skeleton variant="circular" className="h-20 w-20" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="h-6 w-48" />
          <Skeleton variant="text" className="h-4 w-64" />
          <Skeleton variant="text" className="h-4 w-48" />
          <div className="flex gap-6 mt-4">
            <div>
              <Skeleton variant="text" className="h-8 w-8" />
              <Skeleton variant="text" className="h-4 w-16 mt-1" />
            </div>
            <div>
              <Skeleton variant="text" className="h-8 w-8" />
              <Skeleton variant="text" className="h-4 w-20 mt-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stats skeleton
export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
          <Skeleton variant="text" className="h-8 w-16 mb-1" />
          <Skeleton variant="text" className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

// List skeleton
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
          <div className="flex items-center gap-4">
            <Skeleton variant="circular" className="h-12 w-12" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" className="h-5 w-3/4" />
              <Skeleton variant="text" className="h-4 w-1/2" />
            </div>
            <Skeleton variant="rounded" className="h-8 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
