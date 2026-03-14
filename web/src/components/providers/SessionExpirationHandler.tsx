'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Handles session expiration by redirecting to the sign-in page
 * when the session expires flag is set in the auth store.
 *
 * This should be placed near the root of the app to catch all
 * session expiration events.
 */
export function SessionExpirationHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const sessionExpired = useAuthStore((state) => state.sessionExpired);
  const setIsLoading = useAuthStore((state) => state.setLoading);
  const setSessionExpired = useAuthStore((state) => state.setSessionExpired);

  useEffect(() => {
    // If session expired and not already on auth pages, redirect to sign-in
    if (sessionExpired) {
      // Don't redirect if already on auth pages
      const isAuthPage = pathname?.startsWith('/auth/');

      if (!isAuthPage) {
        // Save current path for redirect after sign-in
        sessionStorage.setItem('redirectAfterSignin', pathname || '/');

        // Navigate to sign-in page
        router.push('/auth/signin?session=expired');
      }

      // Reset the flag after handling
      setSessionExpired(false);
    }
  }, [sessionExpired, pathname, router, setSessionExpired]);

  // Also listen for auth state changes from api client
  useEffect(() => {
    const unsubscribe = useAuthStore.subscribe(
      (state) => state.sessionExpired,
      (expired) => {
        if (expired) {
          setIsLoading(false); // Clear any loading state
        }
      }
    );

    return unsubscribe;
  }, [setIsLoading]);

  return null;
}
