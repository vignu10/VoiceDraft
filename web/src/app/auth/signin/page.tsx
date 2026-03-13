'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/auth-store';
import { MailIcon, LockIcon } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const { signIn, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <svg className="mx-auto h-12 w-12" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="oklch(0.52 0.28 285)"/>
              <rect x="11" y="18" width="6" height="12" rx="2" fill="white"/>
              <rect x="21" y="14" width="6" height="20" rx="2" fill="white"/>
              <rect x="31" y="16" width="6" height="16" rx="2" fill="white"/>
            </svg>
          </Link>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Sign in to your account to continue
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
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

            <div className="flex items-center justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                Forgot password?
              </Link>
            </div>

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
          </div>

          {error && (
            <div className="rounded-lg bg-accent-50 dark:bg-accent-950 p-4">
              <p className="text-sm text-accent-600 dark:text-accent-400">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
            className="py-3 text-base"
          >
            Sign in
          </Button>

          {/* OAuth */}
          <div className="relative">
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
            className="py-3 text-base"
            onClick={() => {/* TODO: Implement OAuth */}}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
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
            Sign in with Google
          </Button>

          {/* Sign up link */}
          <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
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
