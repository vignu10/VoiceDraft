import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { handleError } from '@/lib/auth-helpers';
import type { UserProfile, UpdateProfileRequest } from '@/lib/types';

// GET user profile (creates if doesn't exist)
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

    let { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (error) {
      return handleError(error, 'Failed to fetch profile');
    }

    // Auto-create profile if it doesn't exist
    if (!profile) {
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          auth_user_id: user.id,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
          bio: null,
          preferences: { notifications: true },
          is_active: true,
        })
        .select()
        .single();

      if (createError) {
        return handleError(createError, 'Failed to create profile');
      }

      profile = newProfile;
    }

    return NextResponse.json(profile);
  } catch (error) {
    return handleError(error);
  }
}

// POST create user profile
export async function POST(req: NextRequest) {
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

    // Check if profile already exists
    const { data: existing } = await supabaseAdmin
      .from('user_profiles')
      .select('auth_user_id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Profile already exists' }, { status: 400 });
    }

    // Create profile with user metadata
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        auth_user_id: user.id,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        bio: null,
        preferences: { notifications: true },
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return handleError(error, 'Failed to create profile');
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

    const { data: profile, error } = await supabaseAdmin
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
