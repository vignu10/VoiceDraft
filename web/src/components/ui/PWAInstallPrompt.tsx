'use client';

import { useEffect, useState, useCallback } from 'react';
import { Download, X, Smartphone, Home, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

// Expose debug function to reset PWA prompt state (for testing)
if (typeof window !== 'undefined') {
  (window as any).resetPWAPrompt = () => {
    localStorage.removeItem('pwa-install-prompt-seen');
    localStorage.removeItem('pwa-install-prompt-count');
    localStorage.removeItem('pwa-installed');
    sessionStorage.removeItem('ios-prompt-seen');
    console.log('[PWA] Install prompt state reset. Refresh to see the prompt again.');
    // Reload to trigger the prompt again
    window.location.reload();
  };
}

// Check if app is running in standalone mode (already installed)
const isStandalone = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
};

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
  const [promptCount, setPromptCount] = useState(0);
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    // Don't show if already installed as standalone app
    if (isStandalone()) {
      localStorage.setItem('pwa-installed', 'true');
      return;
    }

    // Check if already installed or dismissed
    const seenPrompt = localStorage.getItem('pwa-install-prompt-seen');
    const isInstalled = localStorage.getItem('pwa-installed');
    const count = parseInt(localStorage.getItem('pwa-install-prompt-count') || '0');
    setPromptCount(count);

    if (isInstalled) {
      setHasSeenPrompt(true);
      return;
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

      // Show our custom install prompt if user hasn't permanently dismissed it
      const permanentDismissal = sessionStorage.getItem('pwa-permanent-dismissal');
      if (!permanentDismissal) {
        // Delay showing the prompt for better UX - wait for user to engage
        const delay = count === 0 ? 5000 : 3000; // Longer delay first time
        setTimeout(() => {
          if (!isStandalone()) {
            setShowPrompt(true);
          }
        }, delay);
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      // Clear the deferredPrompt
      setDeferredPrompt(null);
      setShowPrompt(false);
      setShowReminder(false);
      localStorage.setItem('pwa-installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // For iOS, show instructions after some user interaction
    if (isIOSDevice && !isInstalled) {
      const handleUserInteraction = () => {
        // Check if user has permanently dismissed
        const permanentDismissal = sessionStorage.getItem('pwa-permanent-dismissal');
        const iosPromptSeen = sessionStorage.getItem('ios-prompt-seen');

        if (!permanentDismissal && !iosPromptSeen && !isStandalone()) {
          setTimeout(() => {
            if (!isStandalone()) {
              setShowIOSPrompt(true);
            }
          }, 4000);
        }
        // Only show once per session
        window.removeEventListener('scroll', handleUserInteraction);
        window.removeEventListener('click', handleUserInteraction);
      };

      // Show after some interaction
      window.addEventListener('scroll', handleUserInteraction, { once: true });
      window.addEventListener('click', handleUserInteraction, { once: true });
    }

    // Show subtle reminder after 3 sessions if still not installed
    if (seenPrompt && count >= 2 && count < 5 && !isInstalled) {
      setTimeout(() => {
        if (!isStandalone()) {
          setShowReminder(true);
        }
      }, 10000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [promptCount]);

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
    setShowReminder(false);

    // Increment prompt count for showing reminders later
    const newCount = promptCount + 1;
    localStorage.setItem('pwa-install-prompt-count', String(newCount));

    // Mark as seen
    localStorage.setItem('pwa-install-prompt-seen', 'true');
    sessionStorage.setItem('ios-prompt-seen', 'true');

    // If dismissed 5+ times, permanently dismiss
    if (newCount >= 5) {
      sessionStorage.setItem('pwa-permanent-dismissal', 'true');
    }
  }, [promptCount]);

  // Don't show main prompt if already seen (but allow reminders)
  if (hasSeenPrompt && !showReminder) {
    return null;
  }

  // Chrome/Edge/Samsung install prompt
  if (showPrompt && deferredPrompt) {
    return (
      <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-[28rem] z-50 animate-in slide-in-from-bottom fade-in duration-300">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">Install VoiceDraft</span>
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
            <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-4 leading-relaxed">
              Add VoiceDraft to your home screen for instant access. No downloads needed!
            </p>

            <div className="flex gap-3">
              <Button onClick={handleInstallClick} className="flex-1">
                <Home className="w-4 h-4 mr-2" />
                Add to Home
              </Button>
              <Button
                variant="secondary"
                onClick={handleDismiss}
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

  // Subtle reminder banner (for users who dismissed but still not installed)
  if (showReminder && !deferredPrompt) {
    return (
      <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto sm:max-w-sm z-40 animate-in slide-in-from-bottom fade-in duration-300">
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-primary-200 dark:border-primary-800 overflow-hidden">
          <div className="flex items-center gap-3 p-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              <Home className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                Install VoiceDraft?
              </p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Quick access from your home screen
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleDismiss}
              variant="ghost"
              className="flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // iOS install instructions
  if (isIOS && showIOSPrompt) {
    return (
      <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-[28rem] z-50 animate-in slide-in-from-bottom fade-in duration-300">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">Install VoiceDraft</span>
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
            <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-4 leading-relaxed">
              Add VoiceDraft to your home screen for the best experience:
            </p>

            <ol className="text-sm text-neutral-600 dark:text-neutral-400 space-y-3 mb-4">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xs font-bold">1</span>
                <span>Tap the <strong>Share</strong> button <svg className="inline-block w-4 h-4 mx-1 align-text-bottom" fill="currentColor" viewBox="0 0 20 20"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" /></svg> in Safari's menu bar</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xs font-bold">2</span>
                <span>Scroll down and tap <strong>Add to Home Screen</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xs font-bold">3</span>
                <span>Tap <strong>Add</strong> in the top right</span>
              </li>
            </ol>

            <Button
              variant="secondary"
              onClick={handleDismiss}
              fullWidth
            >
              Got it, thanks!
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
