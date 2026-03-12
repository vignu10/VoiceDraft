import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { handleError } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ user: null, session: null }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user, session }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json({ user: null, session: null }, { status: 401 });
    }

    // Get user profile from our database
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        ...profile,
      },
      session: session ? {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
      } : null,
    });
  } catch (error) {
    return handleError(error);
  }
}
