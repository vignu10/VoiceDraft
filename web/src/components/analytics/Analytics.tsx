'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Analytics as VercelAnalytics } from '@vercel/analytics/react';
import { useAnalytics } from '@/stores/analytics-store';

/**
 * Analytics component that initializes tracking and tracks page views.
 * Should be placed in the root layout to track all page navigation.
 */
export function Analytics() {
  const pathname = usePathname();
  const { _setMounted, trackPageView, flushEvents } = useAnalytics();

  // Initialize analytics on mount
  useEffect(() => {
    _setMounted();

    // Flush any pending events on unmount
    return () => {
      flushEvents();
    };
  }, [_setMounted, flushEvents]);

  // Track page views on route changes
  useEffect(() => {
    if (pathname) {
      trackPageView(pathname);
    }
  }, [pathname, trackPageView]);

  return <VercelAnalytics />;
}
