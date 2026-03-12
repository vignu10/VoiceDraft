import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { handleError } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Sign up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status || 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        auth_user_id: data.user.id,
        full_name: name,
        is_active: true,
      });

    if (profileError) {
      console.error('Failed to create user profile:', profileError);
    }

    // Create a default journal for the user
    const { error: journalError } = await supabase
      .from('journals')
      .insert({
        auth_user_id: data.user.id,
        url_prefix: email.split('@')[0].toLowerCase(),
        display_name: `${name}'s Blog`,
        is_active: true,
      });

    if (journalError) {
      console.error('Failed to create default journal:', journalError);
    }

    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name: name,
      },
      session: data.session ? {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      } : null,
    });
  } catch (error) {
    return handleError(error);
  }
}
