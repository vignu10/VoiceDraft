'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { ThemeToggle } from '@/components/theme-toggle';
import { Mic, FileText, LogOut, User } from 'lucide-react';

export function Navigation() {
  const { isAuthenticated, user, signOut } = useAuthStore();

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b-2 border-neutral-200/80 bg-white/95 backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-950/95" aria-label="Main navigation">
      <div className="container-wide">
        <div className="flex h-20 items-center justify-between">
          {/* VoiceDraft brand/logo - Bold and confident */}
          <Link
            href="/"
            className="group flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-lg"
          >
            {/* Bold logo mark */}
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-lg shadow-primary-500/25 transition-all group-hover:shadow-xl group-hover:shadow-primary-500/35 group-hover:scale-105">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 transition-colors group-hover:text-primary-500 font-[family:var(--font-display)]">
                VoiceDraft
              </span>
              <span className="text-[10px] font-medium tracking-wide text-neutral-500 dark:text-neutral-400 uppercase">
                Speak. Create.
              </span>
            </div>
          </Link>

          {/* Right side navigation items */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Authenticated user navigation */}
                <Link
                  href="/record"
                  className="hidden sm:inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-transparent px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  <Mic className="h-4 w-4" />
                  <span className="hidden lg:inline">Record</span>
                </Link>
                <Link
                  href="/drafts"
                  className="hidden sm:inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-transparent px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden lg:inline">Drafts</span>
                </Link>
                <Link
                  href="/#featured-blogs"
                  className="hidden sm:inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:text-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:text-neutral-400"
                >
                  Explore
                </Link>

                {/* User menu */}
                <div className="relative group">
                  <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:text-neutral-300 dark:hover:bg-neutral-800">
                    <User className="h-5 w-5" />
                    <span className="hidden lg:inline truncate max-w-[120px]">
                      {user?.full_name || user?.email?.split('@')[0] || 'Account'}
                    </span>
                  </button>

                  {/* Dropdown menu */}
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <div className="p-2">
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        Settings
                      </Link>
                      <hr className="my-1 border-neutral-200 dark:border-neutral-700" />
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Non-authenticated navigation */}
                <Link
                  href="/#featured-blogs"
                  className="text-sm font-medium text-neutral-600 transition-colors hover:text-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-lg px-3 py-2 dark:text-neutral-400"
                >
                  Explore
                </Link>
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl hover:shadow-primary-500/35 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  Get Started
                </Link>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
