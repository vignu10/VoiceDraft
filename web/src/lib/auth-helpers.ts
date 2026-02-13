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

export function handleError(error: any, message?: string) {
  console.error('API Error:', error);

  const errorMessage = error?.message || message || 'An error occurred';

  return NextResponse.json(
    {
      error: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { details: error?.stack }),
    },
    { status: error?.status || 500 }
  );
}
