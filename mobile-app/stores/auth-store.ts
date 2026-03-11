import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signIn, signUp } from '@/services/api/auth';
import { getProfile } from '@/services/api/profiles';
import { apiClient } from '@/services/api/client';
import { syncGuestDrafts } from '@/utils/guest-sync';
import type { AuthState, UserProfile, Journal } from '@/types/auth';

interface AuthStateExtended extends AuthState {
  setUser: (user: UserProfile) => void;
  setToken: (token: string) => void;
  setJournal: (journal: Journal) => void;
  signInUser: (email: string, password: string, signal?: AbortSignal) => Promise<void>;
  signUpUser: (email: string, password: string, displayName?: string, signal?: AbortSignal) => Promise<void>;
  signOutUser: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  signInWithOAuth: (provider: 'google' | 'linkedin') => Promise<void>;
  cancelPendingRequest: () => void;
  _abortController: AbortController | null;
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
      _abortController: null as AbortController | null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setToken: (accessToken) => {
        if (accessToken) {
          apiClient.setToken(accessToken);
        } else {
          apiClient.clearToken();
        }
        set({ accessToken, isAuthenticated: !!accessToken });
      },

      setJournal: (journal) => set({ journal }),

      clearError: () => set({ error: null }),

      cancelPendingRequest: () => {
        const state = get();
        if (state._abortController) {
          state._abortController.abort();
          set({ _abortController: null, isLoading: false, error: null });
        }
      },

      signInUser: async (email, password, signal) => {
        // Cancel any existing request
        get().cancelPendingRequest();

        // Create new AbortController if no signal provided
        const controller = signal ? undefined : new AbortController();
        const abortSignal = signal || controller?.signal;

        if (controller) {
          set({ _abortController: controller, isLoading: true, error: null });
        } else {
          set({ isLoading: true, error: null });
        }

        try {
          const { user, access_token } = await signIn({ email, password }, abortSignal);
          // Ensure user profile exists after sign in (auto-creates if missing)
          await getProfile();
          set({
            user,
            accessToken: access_token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            _abortController: null,
          });
          // Sync guest drafts from AsyncStorage to server
          await syncGuestDrafts();
        } catch (error) {
          // Don't set error if request was aborted
          if (error instanceof Error && error.name === 'AbortError') {
            set({ isLoading: false, _abortController: null });
            throw error;
          }
          const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
          set({ isLoading: false, error: errorMessage, _abortController: null });
          throw error;
        }
      },

      signUpUser: async (email, password, displayName, signal) => {
        // Cancel any existing request
        get().cancelPendingRequest();

        // Create new AbortController if no signal provided
        const controller = signal ? undefined : new AbortController();
        const abortSignal = signal || controller?.signal;

        if (controller) {
          set({ _abortController: controller, isLoading: true, error: null });
        } else {
          set({ isLoading: true, error: null });
        }

        try {
          const { user, access_token } = await signUp({ email, password, displayName }, abortSignal);
          // Ensure user profile exists after sign up (auto-creates if missing)
          await getProfile();
          set({
            user,
            accessToken: access_token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            _abortController: null,
          });
          // Sync guest drafts from AsyncStorage to server
          await syncGuestDrafts();
        } catch (error) {
          // Don't set error if request was aborted
          if (error instanceof Error && error.name === 'AbortError') {
            set({ isLoading: false, _abortController: null });
            throw error;
          }
          const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
          set({ isLoading: false, error: errorMessage, _abortController: null });
          throw error;
        }
      },

      signInWithOAuth: async (provider: 'google' | 'linkedin') => {
        set({ isLoading: true, error: null });
        try {
          // TODO: Implement OAuth flow
          // For now, this is a placeholder
          throw new Error(`${provider} sign-in not yet implemented`);
          // After implementing OAuth, add:
          // await syncGuestDrafts();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'OAuth failed';
          set({ isLoading: false, error: errorMessage });
          throw error;
        }
      },

      signOutUser: async () => {
        set({ isLoading: true });
        try {
          // Clear all AsyncStorage keys
          await AsyncStorage.multiRemove([
            'access_token',
            'refresh_token',
            'drafts',           // Continue Draft feature
            'guest-drafts',     // Guest drafts
            'guest-draft-storage', // Guest draft storage
          ]);

          // Clear zustand persisted storage by clearing the entire storage
          await AsyncStorage.clear();

          // Clear API client token
          apiClient.clearToken();

          // Reset auth state to initial values
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
        // Don't persist isLoading, error, and _abortController
      }),
    }
  )
);
