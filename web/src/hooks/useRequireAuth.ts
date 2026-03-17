import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { onAuthStateChange } from '@/lib/api-client';

interface UseRequireAuthOptions {
  /**
   * Where to redirect if not authenticated
   * @default '/auth/signin'
   */
  redirectTo?: string;

  /**
   * If true, allow unauthenticated access but listen for auth state changes
   * @default false
   */
  optional?: boolean;

  /**
   * Callback when user needs to authenticate
   */
  onAuthRequired?: () => void;
}

/**
 * Hook for protecting routes and operations that require authentication.
 * Handles session expiration, redirects, and auth state changes.
 *
 * @example
 * // Require auth, redirect to signin
 * useRequireAuth();
 *
 * @example
 * // Require auth with custom redirect
 * useRequireAuth({ redirectTo: '/auth/signup' });
 *
 * @example
 * // Optional auth - don't redirect but listen for changes
 * useRequireAuth({ optional: true });
 */
export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const {
    redirectTo = '/auth/signin',
    optional = false,
    onAuthRequired,
  } = options;

  const router = useRouter();
  const { isAuthenticated, user, accessToken, sessionExpired } = useAuthStore();

  // Handle auth requirement
  const handleAuthRequired = useCallback(() => {
    if (onAuthRequired) {
      onAuthRequired();
    } else if (!optional) {
      // Store current path for redirect after login
      const currentPath = window.location.pathname + window.location.search;
      if (currentPath !== redirectTo) {
        sessionStorage.setItem('redirectAfterLogin', currentPath);
      }
      router.push(redirectTo);
    }
  }, [optional, onAuthRequired, redirectTo, router]);

  // Check auth on mount
  useEffect(() => {
    if (!isAuthenticated && !optional) {
      handleAuthRequired();
    }

    // Handle session expiration
    if (sessionExpired && !optional) {
      const authStore = useAuthStore.getState();
      authStore.setSessionExpired(false);
      handleAuthRequired();
    }
  }, [isAuthenticated, sessionExpired, optional, handleAuthRequired]);

  // Listen for auth state changes (e.g., 401 responses)
  useEffect(() => {
    const unsubscribe = onAuthStateChange((reason) => {
      // Auth state changed - user was logged out
      if (!optional) {
        handleAuthRequired();
      }
    });

    return unsubscribe;
  }, [optional, handleAuthRequired]);

  return {
    isAuthenticated,
    user,
    accessToken,
    requireAuth: handleAuthRequired,
  };
}

/**
 * Hook that validates the current session before performing an action.
 * Returns a wrapper function that checks auth before executing.
 *
 * @example
 * const { withAuthCheck } = useAuthCheck();
 *
 * const handleDelete = withAuthCheck(async () => {
 *   await api.delete('/api/posts/123');
 * });
 */
export function useAuthCheck() {
  const { isAuthenticated, requireAuth } = useRequireAuth();

  const withAuthCheck = useCallback(
    <T extends (...args: unknown[]) => unknown>(
      fn: T
    ): ((...args: Parameters<T>) => ReturnType<T> | void) => {
      return (...args) => {
        if (!isAuthenticated) {
          requireAuth();
          return;
        }
        return fn(...args);
      };
    },
    [isAuthenticated, requireAuth]
  );

  return { withAuthCheck, isAuthenticated, requireAuth };
}
