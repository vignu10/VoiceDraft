import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user, isAuthenticated: !!user, error: null }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      signIn: async (email, password) => {
        set({ isLoading: true, error: null });
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

          const { user } = await response.json();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Sign in failed',
            isLoading: false,
          });
          throw error;
        }
      },

      signUp: async (email, password, name) => {
        set({ isLoading: true, error: null });
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

          const { user } = await response.json();
          set({ user, isAuthenticated: true, isLoading: false });
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
          set({ user: null, isAuthenticated: false, isLoading: false, error: null });
        } catch (error) {
          set({ isLoading: false, error: 'Sign out failed' });
          throw error;
        }
      },

      refreshSession: async () => {
        try {
          const response = await fetch('/api/auth/session');
          if (response.ok) {
            const { user } = await response.json();
            set({ user, isAuthenticated: true });
          } else {
            set({ user: null, isAuthenticated: false });
          }
        } catch (error) {
          set({ user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
