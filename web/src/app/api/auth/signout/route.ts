import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { handleError } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      // Sign out from Supabase
      await supabase.auth.admin.signOut(token);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
