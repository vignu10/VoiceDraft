'use client';

import { useEffect, useState } from 'react';
import { WifiOff, Cloud, AlertCircle } from 'lucide-react';
import { useQueuedRequests } from '@/hooks/useQueuedRequests';
import { cn } from '@/lib/utils';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const { pendingCount } = useQueuedRequests();

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 px-4 py-2 text-sm font-medium text-center transition-all',
        !isOnline
          ? 'bg-accent-500 text-white'
          : pendingCount > 0
          ? 'bg-primary-500 text-white'
          : 'bg-success-500 text-white'
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-center gap-2 max-w-7xl mx-auto">
        {!isOnline && (
          <>
            <WifiOff className="w-4 h-4" />
            <span>You are offline. Changes will sync when you reconnect.</span>
          </>
        )}
        {isOnline && pendingCount > 0 && (
          <>
            <Cloud className="w-4 h-4 animate-pulse" />
            <span>
              {pendingCount} item{pendingCount !== 1 ? 's' : ''} pending sync...
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// Compact version for use in headers
export function OfflineStatusCompact() {
  const [isOnline, setIsOnline] = useState(true);
  const { pendingCount } = useQueuedRequests();

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 text-xs">
      {!isOnline && (
        <div className="flex items-center gap-1 text-accent-600 dark:text-accent-400" title="Offline">
          <WifiOff className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Offline</span>
        </div>
      )}
      {isOnline && pendingCount > 0 && (
        <div className="flex items-center gap-1 text-primary-600 dark:text-primary-400" title={`${pendingCount} items pending sync`}>
          <Cloud className="w-3.5 h-3.5 animate-pulse" />
          <span className="hidden sm:inline">{pendingCount}</span>
        </div>
      )}
    </div>
  );
}
