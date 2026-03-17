import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { resetUnauthorizedFlag } from '@/lib/api-client';

interface User {
  id: string;
  email: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  created_at?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  sessionExpired: boolean; // New flag to track session expiration
  lastValidated: number | null; // Timestamp of last session validation

  // Actions
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSessionExpired: (expired: boolean) => void;
  setLastValidated: (timestamp: number | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  validateSession: () => Promise<boolean>;
  checkSessionOnMount: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      isLoading: false,
      error: null,
      sessionExpired: false,
      lastValidated: null,

      setUser: (user) => set({ user, isAuthenticated: !!user, error: null }),

      setAccessToken: (token) => set({ accessToken: token }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      setSessionExpired: (expired) => set({ sessionExpired: expired }),

      setLastValidated: (timestamp) => set({ lastValidated: timestamp }),

      // Validate current session with the server
      validateSession: async () => {
        const { accessToken } = get();
        if (!accessToken) {
          set({ isAuthenticated: false, user: null, sessionExpired: true });
          return false;
        }

        try {
          const response = await fetch('/api/auth/session', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (response.ok) {
            const { user } = await response.json();
            set({
              user,
              isAuthenticated: true,
              sessionExpired: false,
              lastValidated: Date.now(),
            });
            return true;
          } else if (response.status === 401) {
            set({
              user: null,
              isAuthenticated: false,
              accessToken: null,
              sessionExpired: true,
              lastValidated: null,
            });
            return false;
          } else {
            // For other errors, assume session is still valid
            set({ lastValidated: Date.now() });
            return true;
          }
        } catch (error) {
          // Network error - assume session is still valid to avoid false positives
          console.error('Session validation failed:', error);
          return get().isAuthenticated;
        }
      },

      // Check session on mount (with debounce to avoid repeated calls)
      checkSessionOnMount: () => {
        const { lastValidated, accessToken } = get();
        const VALIDATION_THRESHOLD = 5 * 60 * 1000; // 5 minutes

        // Skip if no token or recently validated
        if (!accessToken) return;
        if (lastValidated && Date.now() - lastValidated < VALIDATION_THRESHOLD) {
          return;
        }

        // Validate session asynchronously (don't block UI)
        get().validateSession();
      },

      signIn: async (email, password) => {
        set({ isLoading: true, error: null, sessionExpired: false });
        try {
          const response = await fetch('/api/auth/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Sign in failed');
          }

          const { user, session } = await response.json();
          set({
            user,
            accessToken: session?.access_token || null,
            isAuthenticated: true,
            isLoading: false,
          });

          // Reset the unauthorized flag on successful login
          resetUnauthorizedFlag();
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Sign in failed',
            isLoading: false,
          });
          throw error;
        }
      },

      signUp: async (email, password, name) => {
        set({ isLoading: true, error: null, sessionExpired: false });
        try {
          const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Sign up failed');
          }

          const { user, session } = await response.json();
          set({
            user,
            accessToken: session?.access_token || null,
            isAuthenticated: true,
            isLoading: false,
          });

          // Reset the unauthorized flag on successful signup
          resetUnauthorizedFlag();
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Sign up failed',
            isLoading: false,
          });
          throw error;
        }
      },

      signInWithGoogle: async () => {
        set({ isLoading: true, error: null, sessionExpired: false });
        try {
          // Get the OAuth URL from the server
          const response = await fetch('/api/auth/oauth/url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider: 'google' }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to initiate OAuth');
          }

          const { url } = await response.json();

          // Redirect to OAuth provider
          window.location.href = url;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'OAuth failed',
            isLoading: false,
          });
          throw error;
        }
      },

      signOut: async () => {
        set({ isLoading: true });
        try {
          await fetch('/api/auth/signout', { method: 'POST' });
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            sessionExpired: false,
            lastValidated: null,
          });
        } catch (error) {
          set({ isLoading: false, error: 'Sign out failed' });
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        // Don't persist sessionExpired flag and lastValidated timestamp
      }),
    }
  )
);
