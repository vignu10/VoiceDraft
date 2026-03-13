import { create } from 'zustand';
import { api } from '@/lib/api-client';

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
  _hasMounted: boolean;

  // Actions
  _setMounted: () => void;
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

let sessionId = '';

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

export const useAnalytics = create<AnalyticsState>()((set, get) => ({
  isConsent: null,
  events: [],
  sessionId: getOrGenerateSessionId(),
  _hasMounted: false,

  _setMounted: () => {
    if (typeof window === 'undefined' || get()._hasMounted) return;
    const consent = localStorage.getItem('analytics_consent') === 'true';
    set({ isConsent: consent, _hasMounted: true });
  },

  setConsent: (consent) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('analytics_consent', String(consent));
    }
    set({ isConsent: consent });
  },

  getSessionId: () => getOrGenerateSessionId(),

  track: (type, properties = {}) => {
    if (typeof window === 'undefined') return;
    const hasConsent = get().isConsent === true;
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
  },

  flushEvents: async () => {
    const state = get();
    if (state.events.length === 0) return;

    try {
      const response = await api.post('/api/analytics/events', { events: state.events });

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
}));

// Initialize on client side
if (typeof window !== 'undefined') {
  // Load consent from localStorage on mount
  useAnalytics.getState()._setMounted();

  // Auto-flush events every 30 seconds
  setInterval(() => {
    const store = useAnalytics.getState();
    if (store.events.length > 0) {
      store.flushEvents();
    }
  }, 30000);

  // Flush on page hide
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      const store = useAnalytics.getState();
      if (store.events.length > 0) {
        store.flushEvents();
      }
    }
  });
}
