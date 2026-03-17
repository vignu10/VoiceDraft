'use client';

import { useEffect, useState, useCallback } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

// Expose debug function to reset PWA prompt state (for testing)
if (typeof window !== 'undefined') {
  (window as any).resetPWAPrompt = () => {
    localStorage.removeItem('pwa-install-prompt-seen');
    localStorage.removeItem('pwa-installed');
    sessionStorage.removeItem('ios-prompt-seen');
    console.log('[PWA] Install prompt state reset. Refresh to see the prompt again.');
    // Reload to trigger the prompt again
    window.location.reload();
  };
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [hasSeenPrompt, setHasSeenPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed or dismissed
    const seenPrompt = localStorage.getItem('pwa-install-prompt-seen');
    const isInstalled = localStorage.getItem('pwa-installed');
    if (seenPrompt || isInstalled) {
      setHasSeenPrompt(true);
    }

    // Check if running on iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) &&
                       !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Listen for beforeinstallprompt event (Chrome, Edge, Samsung)
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show our custom install prompt if user hasn't seen it
      if (!hasSeenPrompt) {
        // Delay showing the prompt slightly for better UX
        setTimeout(() => {
          setShowPrompt(true);
        }, 2000);
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      // Clear the deferredPrompt
      setDeferredPrompt(null);
      setShowPrompt(false);
      localStorage.setItem('pwa-installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // For iOS, show instructions after some user interaction
    if (isIOSDevice && !hasSeenPrompt && !isInstalled) {
      const handleUserInteraction = () => {
        // Check if user has already seen the iOS prompt
        const iosPromptSeen = sessionStorage.getItem('ios-prompt-seen');
        if (!iosPromptSeen) {
          setTimeout(() => {
            setShowIOSPrompt(true);
          }, 3000);
        }
        // Only show once per session
        window.removeEventListener('scroll', handleUserInteraction);
        window.removeEventListener('click', handleUserInteraction);
      };

      // Show after some interaction
      window.addEventListener('scroll', handleUserInteraction, { once: true });
      window.addEventListener('click', handleUserInteraction, { once: true });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [hasSeenPrompt]);

  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      localStorage.setItem('pwa-installed', 'true');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowPrompt(false);
    localStorage.setItem('pwa-install-prompt-seen', 'true');
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    setShowIOSPrompt(false);
    localStorage.setItem('pwa-install-prompt-seen', 'true');
    sessionStorage.setItem('ios-prompt-seen', 'true');
  }, []);

  // Don't show if already installed or dismissed
  if (hasSeenPrompt) {
    return null;
  }

  // Chrome/Edge/Samsung install prompt
  if (showPrompt && deferredPrompt) {
    return (
      <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 animate-in slide-in-from-bottom fade-in duration-300">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              <span className="font-semibold">Install App</span>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-4">
              Install VoiceDraft on your device for quick access and a better experience.
            </p>

            <div className="flex gap-3">
              <Button onClick={handleInstallClick} className="flex-1">
                <Smartphone className="w-4 h-4 mr-2" />
                Install Now
              </Button>
              <Button
                variant="secondary"
                onClick={handleDismiss}
                className="flex-1"
              >
                Not Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // iOS install instructions
  if (isIOS && showIOSPrompt) {
    return (
      <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 animate-in slide-in-from-bottom fade-in duration-300">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              <span className="font-semibold">Add to Home Screen</span>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-4">
              Install VoiceDraft on your iPhone or iPad:
            </p>

            <ol className="text-sm text-neutral-600 dark:text-neutral-400 space-y-2 mb-4">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xs font-semibold">1</span>
                <span>Tap the <strong>Share</strong> button <svg className="inline-block w-4 h-4 mx-1 align-text-bottom" fill="currentColor" viewBox="0 0 20 20"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" /></svg> in Safari</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xs font-semibold">2</span>
                <span>Scroll down and tap <strong>Add to Home Screen</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xs font-semibold">3</span>
                <span>Tap <strong>Add</strong> to install the app</span>
              </li>
            </ol>

            <Button
              variant="secondary"
              onClick={handleDismiss}
              fullWidth
            >
              Got it
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
