'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Download, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedEnhancedServiceWorkerRegistration extends EnhancedServiceWorkerRegistration {
  waiting?: ServiceWorker | null;
  addEventListener?: (
    type: string,
    listener: EventListenerOrEventListenerObject
  ) => void;
}

export function AppUpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        const swRegistration = registration as EnhancedServiceWorkerRegistration;

        // Check if there's already a waiting SW
        if (swRegistration.waiting) {
          setShowUpdate(true);
        }

        // Listen for new SW installing
        swRegistration.addEventListener('updatefound', () => {
          const newWorker = swRegistration.installing;

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                swRegistration.active
              ) {
                // New SW is installed, waiting to activate
                setShowUpdate(true);
              }
            });
          }
        });
      });

      // Listen for controller changes (SW activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Reload the page when new SW takes control
        window.location.reload();
      });
    }
  }, []);

  const handleUpdate = () => {
    if ('serviceWorker' in navigator) {
      setIsUpdating(true);
      navigator.serviceWorker.ready.then((registration) => {
        const swRegistration = registration as EnhancedServiceWorkerRegistration;

        // Tell the waiting SW to skip waiting and become active
        if (swRegistration.waiting) {
          swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    }
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 animate-in slide-in-from-bottom fade-in duration-300">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            <span className="font-semibold">Update Available</span>
          </div>
          <button
            onClick={() => setShowUpdate(false)}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-4">
            A new version of VoiceScribe is available. Update now to get the latest
            features and improvements.
          </p>

          <div className="flex gap-3">
            <Button
              onClick={handleUpdate}
              isLoading={isUpdating}
              className="flex-1"
            >
              Update Now
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowUpdate(false)}
              className="flex-1"
            >
              Later
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
