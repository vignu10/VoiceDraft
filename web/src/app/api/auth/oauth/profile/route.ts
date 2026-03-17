import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user from the access token
    const authUser = await getUserFromRequest(req);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { email, full_name, avatar_url } = body;

    // Check if profile exists
    const { data: existingProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email, full_name, avatar_url')
      .eq('id', authUser.id)
      .single();

    if (existingProfile) {
      // Profile exists, return it
      return NextResponse.json({ user: existingProfile });
    }

    // Create new profile
    const { data: newProfile, error: insertError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: authUser.id,
        email: email || authUser.email || '',
        full_name: full_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
        avatar_url: avatar_url || authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || '',
      })
      .select('id, email, full_name, avatar_url, created_at')
      .single();

    if (insertError) {
      console.error('Profile creation error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: newProfile });
  } catch (error) {
    console.error('OAuth profile error:', error);
    return NextResponse.json(
      { error: 'Failed to process OAuth profile' },
      { status: 500 }
    );
  }
}
