'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogoIcon } from '@/components/logo';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/lib/supabase';
import { AlertCircle } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { setUser, setAccessToken } = useAuthStore();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      // Give Supabase a moment to process the OAuth callback
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        // Check URL hash for access token (Supabase may pass it there)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');

        // Supabase handles the OAuth callback and sets up the session
        // We just need to get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          setError('Failed to get session. Please try again.');
          setIsLoading(false);
          setTimeout(() => router.push('/auth/signin'), 3000);
          return;
        }

        if (!session || !session.user) {
          // Try checking URL params as fallback
          const urlParams = new URLSearchParams(window.location.search);
          const errorParam = urlParams.get('error');
          const errorDescription = urlParams.get('error_description');

          if (errorParam) {
            setError(errorDescription || 'Sign in was cancelled or failed');
          } else {
            setError('No session found. Please sign in again.');
          }
          setIsLoading(false);
          setTimeout(() => router.push('/auth/signin'), 3000);
          return;
        }

        // Get or create user profile from our database
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          // If profile doesn't exist, try to create it
          if (response.status === 401) {
            // Create profile with OAuth user data
            const createResponse = await fetch('/api/auth/oauth/profile', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
                avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '',
              }),
            });

            if (createResponse.ok) {
              const { user } = await createResponse.json();
              setUser(user);
              setAccessToken(session.access_token);
              setTimeout(() => router.push('/'), 500);
              return;
            }
          }
          throw new Error('Failed to get user profile');
        }

        const { user } = await response.json();

        // Set the auth state
        setUser(user);
        setAccessToken(session.access_token);

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
  }, [router, setUser, setAccessToken]);

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
