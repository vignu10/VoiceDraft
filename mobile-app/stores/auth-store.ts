import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signIn, signOut, signUp } from '@/services/api/auth';
import { getProfile } from '@/services/api/profiles';
import type { AuthState, UserProfile, Journal } from '@/types/auth';

interface AuthStateExtended extends AuthState {
  setUser: (user: UserProfile) => void;
  setToken: (token: string) => void;
  setJournal: (journal: Journal) => void;
  signInUser: (email: string, password: string) => Promise<void>;
  signUpUser: (email: string, password: string, displayName?: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  signInWithOAuth: (provider: 'google' | 'linkedin') => Promise<void>;
}

const initialState: AuthState = {
  isAuthenticated: false,
  accessToken: null,
  user: null,
  journal: null,
};

export const useAuthStore = create<AuthStateExtended>()(
  persist(
    (set, get) => ({
      ...initialState,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setToken: (accessToken) => set({ accessToken, isAuthenticated: !!accessToken }),

      setJournal: (journal) => set({ journal }),

      clearError: () => set({ error: null }),

      signInUser: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { user, access_token } = await signIn({ email, password });
          // Ensure user profile exists after sign in (auto-creates if missing)
          await getProfile();
          set({
            user,
            accessToken: access_token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
          set({ isLoading: false, error: errorMessage });
          throw error;
        }
      },

      signUpUser: async (email, password, displayName) => {
        set({ isLoading: true, error: null });
        try {
          const { user, access_token } = await signUp({ email, password, displayName });
          // Ensure user profile exists after sign up (auto-creates if missing)
          await getProfile();
          set({
            user,
            accessToken: access_token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
          set({ isLoading: false, error: errorMessage });
          throw error;
        }
      },

      signInWithOAuth: async (provider: 'google' | 'linkedin') => {
        set({ isLoading: true, error: null });
        try {
          // TODO: Implement OAuth flow
          // For now, this is a placeholder
          throw new Error(`${provider} sign-in not yet implemented`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'OAuth failed';
          set({ isLoading: false, error: errorMessage });
          throw error;
        }
      },

      signOutUser: async () => {
        set({ isLoading: true });
        try {
          await signOut();
          set({ ...initialState, isLoading: false, error: null });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
          set({ isLoading: false, error: errorMessage });
          throw error;
        }
      },
    }),
    {
      name: 'voicedraft-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Persist only these fields
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        user: state.user,
        journal: state.journal,
        // Don't persist isLoading and error
      }),
    }
  )
);
