import { create } from 'zustand';
import * as idb from '@/lib/indexedDB';

interface AnalyticsEvent {
  id: string;
  type: string;
  properties: Record<string, unknown>;
  timestamp: number;
}

interface AnalyticsState {
  isConsent: boolean | null;
  events: AnalyticsEvent[];
  sessionId: string;

  // Actions
  setConsent: (consent: boolean) => void;
  track: (type: string, properties?: Record<string, unknown>) => void;
  flushEvents: () => Promise<void>;
  getSessionId: () => string;

  // Helper methods
  trackPageView: (page: string) => void;
  trackDraftAction: (action: string, properties?: Record<string, unknown>) => void;
  trackRecording: (duration: number, properties?: Record<string, unknown>) => void;
  trackError: (error: string, context?: Record<string, unknown>) => void;
}

export const useAnalytics = create<AnalyticsState>()((set, get) => {
  let sessionId = '';

  // Generate or get session ID
  const getOrGenerateSessionId = () => {
    if (typeof window === 'undefined') return 'ssr-session';
    if (!sessionId) {
      sessionId = localStorage.getItem('analytics_session_id') || '';
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem('analytics_session_id', sessionId);
      }
    }
    return sessionId;
  };

  // Check if we're on client side
  const isClient = typeof window !== 'undefined';
  const consent = isClient ? localStorage.getItem('analytics_consent') === 'true' : null;

  return {
    isConsent: consent,
    events: [],
    sessionId: getOrGenerateSessionId(),

    setConsent: (consent) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('analytics_consent', String(consent));
      }
      set({ isConsent: consent });
    },

    getSessionId: () => getOrGenerateSessionId(),

    track: (type, properties = {}) => {
      if (typeof window === 'undefined') return;
      const hasConsent = localStorage.getItem('analytics_consent') === 'true';
      if (!hasConsent) return;

      const event: AnalyticsEvent = {
        id: crypto.randomUUID(),
        type,
        properties: {
          ...properties,
          sessionId: getOrGenerateSessionId(),
        },
        timestamp: Date.now(),
      };

      // Add to in-memory events
      set((state) => ({ events: [...state.events, event] }));

      // Also save to IndexedDB for persistence
      idb.saveDraftOffline({
        id: `event-${event.id}`,
        event_type: 'analytics',
        event_data: event,
        synced: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any).catch(console.error);
    },

    flushEvents: async () => {
      const state = get();
      if (state.events.length === 0) return;

      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        const response = await fetch('/api/analytics/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ events: state.events }),
        });

        if (response.ok) {
          set({ events: [] });
        }
      } catch (error) {
        console.error('Failed to flush analytics:', error);
      }
    },

    trackPageView: (page) => {
      if (typeof window !== 'undefined') {
        get().track('page_view', { page, referrer: document.referrer });
      }
    },

    trackDraftAction: (action, properties = {}) => {
      get().track('draft_action', { action, ...properties });
    },

    trackRecording: (duration, properties = {}) => {
      get().track('recording', { duration_seconds: duration, ...properties });
    },

    trackError: (error, context = {}) => {
      get().track('error', { error, ...context });
    },
  };
});

// Auto-flush events every 30 seconds
if (typeof window !== 'undefined') {
  setInterval(() => {
    const store = useAnalytics.getState();
    if (store.events.length > 0) {
      store.flushEvents();
    }
  }, 30000);
}

// Flush on page hide
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      const store = useAnalytics.getState();
      if (store.events.length > 0) {
        store.flushEvents();
      }
    }
  });
}
