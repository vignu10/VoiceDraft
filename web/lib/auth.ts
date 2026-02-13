// ============================================================================
// Auth Utilities
// ============================================================================

import { supabase } from './config';
import type { AuthenticatedUser } from './types';
import { AuthError } from './types';

// ============================================================================
// Extract Token from Authorization Header
// ============================================================================

export const extractToken = (authHeader: string | null): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

// ============================================================================
// Verify User Authentication
// ============================================================================

export const verifyAuth = async (request: Request): Promise<AuthenticatedUser> => {
  // Check for Authorization header
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    throw new AuthError('No authorization token provided', 401);
  }

  // Extract token
  const token = extractToken(authHeader);

  if (!token) {
    throw new AuthError('Invalid authorization header format', 401);
  }

  // Verify token with Supabase
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    throw new AuthError('Invalid or expired token', 401);
  }

  // Return user object
  return {
    id: data.user.id,
    email: data.user.email || '',
    journalId: data.user.user_metadata?.journal_id as string || '',
    metadata: data.user.user_metadata || {},
  };
};

// ============================================================================
// Optional Auth (for public endpoints)
// ============================================================================

export const optionalAuth = async (request: Request): Promise<AuthenticatedUser | null> => {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = extractToken(authHeader);
    if (!token) {
      return null;
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return null;
    }

    return {
      id: data.user.id,
      email: data.user.email || '',
      journalId: data.user.user_metadata?.journal_id as string || '',
      metadata: data.user.user_metadata || {},
    };
  } catch {
    return null;
  }
};
