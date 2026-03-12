import { useState, useEffect } from 'react';
import * as idb from '@/lib/indexedDB';

export function useQueuedRequests() {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const updateCount = async () => {
      const requests = await idb.getQueuedRequests();
      setPendingCount(requests.length);
    };

    updateCount();

    // Update count every 5 seconds in case it changes
    const interval = setInterval(updateCount, 5000);

    // Also update when storage changes (another tab/window)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'queued_requests_updated') {
        updateCount();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return { pendingCount };
}
