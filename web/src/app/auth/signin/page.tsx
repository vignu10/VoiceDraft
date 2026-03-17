'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LogoIcon } from '@/components/logo';
import { useAuthStore } from '@/stores/auth-store';
import { MailIcon, LockIcon, AlertCircle } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signInWithGoogle, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);

  useEffect(() => {
    // Check if session expired flag is in URL
    if (searchParams?.get('session') === 'expired') {
      setSessionExpired(true);
    }

    // Check for OAuth errors
    const oauthError = searchParams?.get('oauth_error');
    if (oauthError) {
      const errorMessages: Record<string, string> = {
        access_denied: 'Sign in was cancelled or access was denied',
        session_failed: 'Failed to establish a session',
        no_code: 'OAuth flow failed - no code received',
        no_session: 'Failed to create a session',
        unknown: 'An unknown error occurred during sign in',
      };
      setError(errorMessages[oauthError] || 'Sign in failed. Please try again.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await signIn(email, password);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsOAuthLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign in failed');
      setIsOAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-6 sm:py-8 lg:py-12 bg-neutral-50 dark:bg-neutral-950">
      <div className="w-full max-w-sm sm:max-w-md space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <LogoIcon size={48} className="mx-auto sm:h-12 sm:w-12" />
          </Link>
          <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Welcome back
          </h2>
          <p className="mt-1.5 sm:mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Sign in to your account to continue
          </p>
        </div>

        {/* Session expired message */}
        {sessionExpired && (
          <div className="rounded-lg bg-warning-50 dark:bg-warning-950 border border-warning-200 dark:border-warning-800 p-3 sm:p-4 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-left">
              <h3 className="text-sm font-semibold text-warning-900 dark:text-warning-100">
                Session expired
              </h3>
              <p className="text-sm text-warning-700 dark:text-warning-300 mt-1">
                Your session has expired. Please sign in again to continue.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-3 sm:space-y-4">
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<MailIcon className="h-5 w-5" />}
            />

            <div className="space-y-3 sm:space-y-4">
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<LockIcon className="h-5 w-5" />}
              />
              <div className="text-right">
                <Link
                  href="/auth/forgot-password"
                  className="text-xs sm:text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  Forgot password?
                </Link>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-accent-50 dark:bg-accent-950 p-3 sm:p-4">
              <p className="text-sm text-accent-600 dark:text-accent-400">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
            className="min-h-[48px] sm:min-h-[52px] py-3 text-base"
          >
            Sign in
          </Button>

          {/* OAuth */}
          <div className="relative pt-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-300 dark:border-neutral-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white dark:bg-neutral-900 px-2 text-neutral-500">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            fullWidth
            className="min-h-[48px] sm:min-h-[52px] py-3 text-base"
            onClick={handleGoogleSignIn}
            disabled={isLoading || isOAuthLoading}
            isLoading={isOAuthLoading}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="hidden sm:inline">Sign in with Google</span>
            <span className="sm:hidden">Google</span>
          </Button>

          {/* Sign up link */}
          <p className="text-center text-sm text-neutral-600 dark:text-neutral-400 pt-2">
            New here?{' '}
            <Link
              href="/auth/signup"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
