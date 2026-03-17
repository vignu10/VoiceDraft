'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogoIcon } from '@/components/logo';
import { useAuthStore } from '@/stores/auth-store';
import { AlertCircle } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setAccessToken } = useAuthStore();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      const accessToken = searchParams?.get('access_token');
      const refreshToken = searchParams?.get('refresh_token');

      if (!accessToken) {
        setError('No access token received');
        setIsLoading(false);
        return;
      }

      try {
        // Get user info using the access token
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to get user session');
        }

        const { user } = await response.json();

        // Set the auth state
        setUser(user);
        setAccessToken(accessToken);

        // Store refresh token if available
        if (refreshToken) {
          localStorage.setItem('voiceDraft-refresh-token', refreshToken);
        }

        // Redirect to home
        setTimeout(() => {
          router.push('/');
        }, 500);
      } catch (err) {
        console.error('Callback processing error:', err);
        setError('Failed to complete sign in. Please try again.');
        setIsLoading(false);

        // Redirect to signin after a delay
        setTimeout(() => {
          router.push('/auth/signin');
        }, 3000);
      }
    };

    processCallback();
  }, [searchParams, router, setUser, setAccessToken]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-neutral-50 dark:bg-neutral-950">
      <div className="w-full max-w-md space-y-8 text-center">
        <LogoIcon size={48} className="mx-auto h-12 w-12" />

        {isLoading ? (
          <>
            <div className="flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500/30 border-t-primary-500" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              Signing you in...
            </h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Please wait while we complete your sign in.
            </p>
          </>
        ) : error ? (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-100 dark:bg-accent-900/30">
              <AlertCircle className="h-6 w-6 text-accent-500" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              Sign in failed
            </h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              {error}
            </p>
            <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-500">
              Redirecting to sign in page...
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
