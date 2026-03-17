'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useRequireAuth } from '@/hooks/useRequireAuth';

interface AuthGuardProps {
  /**
   * Children to render if authenticated
   */
  children: React.ReactNode;

  /**
   * Where to redirect if not authenticated
   * @default '/auth/signin'
   */
  redirectTo?: string;

  /**
   * Paths that should not trigger auth check
   */
  publicPaths?: string[];

  /**
   * Show loading state while checking auth
   */
  loadingFallback?: React.ReactNode;
}

/**
 * Component that protects routes requiring authentication.
 * Redirects unauthenticated users to the sign-in page.
 *
 * @example
 * <AuthGuard>
 *   <DashboardPage />
 * </AuthGuard>
 *
 * @example
 * <AuthGuard publicPaths={['/public', '/about']}>
 *   <App />
 * </AuthGuard>
 */
export function AuthGuard({
  children,
  redirectTo = '/auth/signin',
  publicPaths = ['/auth/signin', '/auth/signup', '/'],
  loadingFallback,
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const checkSessionOnMount = useAuthStore((state) => state.checkSessionOnMount);

  // Validate session on mount for protected pages
  useEffect(() => {
    const isPublicPath = publicPaths.some((path) =>
      pathname === path || pathname.startsWith(path)
    );

    if (!isPublicPath && isAuthenticated) {
      checkSessionOnMount();
    }
  }, [pathname, isAuthenticated, publicPaths, checkSessionOnMount]);

  // Use the useRequireAuth hook for auth checking
  useRequireAuth({
    redirectTo,
    optional: publicPaths.some((path) => pathname === path || pathname.startsWith(path)),
  });

  // Show loading state while checking auth
  if (isLoading && loadingFallback) {
    return <>{loadingFallback}</>;
  }

  // Don't render children if not authenticated and not on a public path
  const isPublicPath = publicPaths.some((path) =>
    pathname === path || pathname.startsWith(path)
  );

  if (!isAuthenticated && !isPublicPath) {
    return null;
  }

  return <>{children}</>;
}

interface RequireAuthProps {
  /**
   * Children to render if authenticated
   */
  children: React.ReactNode;

  /**
   * Fallback to render if not authenticated
   */
  fallback?: React.ReactNode;

  /**
   * Where to redirect if not authenticated (instead of showing fallback)
   */
  redirectTo?: string;
}

/**
 * Simpler component that conditionally renders children based on auth state.
 * Use this for section-level auth checks (not page-level).
 *
 * @example
 * <RequireAuth fallback={<SignInPrompt />}>
 *   <UserSettings />
 * </RequireAuth>
 *
 * @example
 * <RequireAuth redirectTo="/auth/signin">
 *   <PrivateContent />
 * </RequireAuth>
 */
export function RequireAuth({ children, fallback, redirectTo }: RequireAuthProps) {
  const { isAuthenticated } = useRequireAuth({
    optional: !!fallback,
    redirectTo,
  });

  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return null;
  }

  return <>{children}</>;
}
