import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { handleError } from '@/lib/auth-helpers';
import type { UserProfile, UpdateProfileRequest, ApiResponse } from '@/lib/types';

// GET user profile
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (error) {
      return handleError(error, 'Failed to fetch profile');
    }

    return NextResponse.json(profile);
  } catch (error) {
    return handleError(error);
  }
}

// PUT update user profile
export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body: UpdateProfileRequest = await req.json();

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('auth_user_id', user.id)
      .select()
      .single();

    if (error) {
      return handleError(error, 'Failed to update profile');
    }

    return NextResponse.json(profile);
  } catch (error) {
    return handleError(error);
  }
}
