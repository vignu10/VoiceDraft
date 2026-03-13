import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { resetUnauthorizedFlag } from '@/lib/api-client';

interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  sessionExpired: boolean; // New flag to track session expiration

  // Actions
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSessionExpired: (expired: boolean) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      isLoading: false,
      error: null,
      sessionExpired: false,

      setUser: (user) => set({ user, isAuthenticated: !!user, error: null }),

      setAccessToken: (token) => set({ accessToken: token }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      setSessionExpired: (expired) => set({ sessionExpired: expired }),

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
        // Don't persist sessionExpired flag
      }),
    }
  )
);
