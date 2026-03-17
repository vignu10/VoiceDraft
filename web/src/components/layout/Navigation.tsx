'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { ThemeToggle } from '@/components/theme-toggle';
import { LogoIcon, LogoWordmark } from '@/components/logo';
import { Mic, FileText, LogOut, User, ChevronDown } from 'lucide-react';

export function Navigation() {
  const { isAuthenticated, user, signOut } = useAuthStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node) &&
        userMenuButtonRef.current &&
        !userMenuButtonRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard interaction for user menu
  const handleUserMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsUserMenuOpen((prev) => !prev);
    } else if (e.key === 'Escape' && isUserMenuOpen) {
      e.preventDefault();
      setIsUserMenuOpen(false);
      userMenuButtonRef.current?.focus();
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b-2 border-neutral-200/80 bg-white/95 backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-950/95" aria-label="Main navigation">
      <div className="container-wide">
        <div className="flex h-20 items-center justify-between">
          {/* VoiceDraft brand/logo - Bold and confident */}
          <Link
            href="/"
            className="group flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-lg"
          >
            <LogoIcon size={32} className="transition-transform duration-300 group-hover:scale-110" />
            <LogoWordmark size="md" className="hidden sm:block" />
          </Link>

          {/* Right side navigation items */}
          <div className="flex items-center gap-4 sm:gap-6">
            {isAuthenticated ? (
              <>
                {/* Authenticated user navigation */}
                <Link
                  href="/record"
                  className="hidden sm:inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-transparent min-h-[44px] px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  <Mic className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden lg:inline">Record</span>
                </Link>
                <Link
                  href="/drafts"
                  className="hidden sm:inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-transparent min-h-[44px] px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden lg:inline">Drafts</span>
                </Link>
                <Link
                  href="/discover"
                  className="hidden sm:inline-flex items-center justify-center rounded-lg min-h-[44px] px-4 py-3 text-sm font-medium text-neutral-600 transition-colors hover:text-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:text-neutral-400"
                >
                  Explore
                </Link>

                {/* User menu - with keyboard support and ARIA */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    ref={userMenuButtonRef}
                    className="flex items-center gap-2 rounded-lg min-h-[44px] px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    onClick={() => setIsUserMenuOpen((prev) => !prev)}
                    onKeyDown={handleUserMenuKeyDown}
                    aria-haspopup="true"
                    aria-expanded={isUserMenuOpen}
                    aria-label="User menu"
                  >
                    <User className="h-5 w-5" aria-hidden="true" />
                    <span className="hidden lg:inline truncate max-w-[120px]">
                      {user?.full_name || user?.email?.split('@')[0] || 'Account'}
                    </span>
                    <ChevronDown
                      className="h-4 w-4 transition-transform duration-200"
                      style={{ transform: isUserMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      aria-hidden="true"
                    />
                  </button>

                  {/* Dropdown menu */}
                  <div
                    className={`absolute right-0 top-full mt-2 w-48 bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-800 transition-all ${
                      isUserMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                    }`}
                    role="menu"
                    aria-label="User menu items"
                  >
                    <div className="p-2">
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                        role="menuitem"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4" aria-hidden="true" />
                        Profile
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                        role="menuitem"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Settings
                      </Link>
                      <hr className="my-1 border-neutral-200 dark:border-neutral-700" />
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                        role="menuitem"
                      >
                        <LogOut className="h-4 w-4" aria-hidden="true" />
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
                  href="/discover"
                  className="text-sm font-medium text-neutral-600 transition-colors hover:text-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-lg min-h-[44px] px-4 py-3 dark:text-neutral-400"
                >
                  Explore
                </Link>
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 min-h-[48px] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl hover:shadow-primary-500/35 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary-500/50 focus:ring-offset-2"
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
