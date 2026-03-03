import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase';

export async function requireAuth(req: NextRequest) {
  const user = await getUserFromRequest(req);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return user;
}

export async function optionalAuth(req: NextRequest) {
  return await getUserFromRequest(req);
}

interface ErrorWithStatus extends Error {
  status?: number;
  stack?: string;
}

export function handleError(error: unknown, message?: string) {
  const err = error as ErrorWithStatus;
  const errorMessage = err?.message || message || 'An error occurred';

  return NextResponse.json(
    {
      error: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { details: err?.stack }),
    },
    { status: err?.status || 500 }
  );
}
