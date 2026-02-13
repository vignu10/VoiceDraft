import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeAuth, signIn, signOut, signUp } from '@/services/api/auth';
import type { AuthState, UserProfile, Journal } from '@/types/auth';

interface AuthStateExtended extends AuthState {
  setUser: (user: UserProfile) => void;
  setToken: (token: string) => void;
  setJournal: (journal: Journal) => void;
  signInUser: (email: string, password: string) => Promise<void>;
  signUpUser: (email: string, password: string, displayName?: string) => Promise<void>;
  signOutUser: () => Promise<void>;
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

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setToken: (accessToken) => set({ accessToken, isAuthenticated: !!accessToken }),

      setJournal: (journal) => set({ journal }),

      signInUser: async (email, password) => {
        try {
          const { user, access_token } = await signIn({ email, password });
          set({
            user,
            accessToken: access_token,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error('Sign in error:', error);
          throw error;
        }
      },

      signUpUser: async (email, password, displayName) => {
        try {
          const { user, access_token } = await signUp({ email, password, displayName });
          set({
            user,
            accessToken: access_token,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error('Sign up error:', error);
          throw error;
        }
      },

      signOutUser: async () => {
        try {
          await signOut();
          set(initialState);
        } catch (error) {
          console.error('Sign out error:', error);
          throw error;
        }
      },
    }),
    {
      name: 'voicedraft-auth',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
