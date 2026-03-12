'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '@/stores/auth-store';

export function useAuthState() {
  // Default auth state for SSR or before hydration
  const defaultState = useMemo(() => ({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    isLoading: false,
    error: null,
  }), []);

  const [isHydrated, setIsHydrated] = useState(false);
  const authState = useAuthStore();

  useEffect(() => {
    // Mark as hydrated after first render on client
    setIsHydrated(true);
  }, []);

  // Return default state while hydrating to prevent SSR mismatch
  if (!isHydrated) {
    return defaultState;
  }

  return authState;
}
