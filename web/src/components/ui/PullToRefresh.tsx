import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  pullProgress: number;
  isPulling: boolean;
  isRefreshing: boolean;
  threshold?: number;
}

export function PullToRefreshIndicator({
  pullDistance,
  pullProgress,
  isPulling,
  isRefreshing,
  threshold = 80,
}: PullToRefreshIndicatorProps) {
  if (pullDistance === 0 && !isRefreshing) return null;

  const rotation = pullProgress * 360;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-center pointer-events-none"
      style={{
        height: `${Math.min(pullDistance, threshold * 1.2)}px`,
      }}
    >
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
          isRefreshing || isPulling
            ? 'bg-primary-500 text-white'
            : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
        )}
      >
        <RefreshCw
          className="w-5 h-5"
          style={{
            transform: `rotate(${rotation}deg)`,
            animation: isRefreshing ? 'spin 1s linear infinite' : undefined,
          }}
        />
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
