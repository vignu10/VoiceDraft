import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      console.error('OAuth error:', error, errorDescription);
      return NextResponse.redirect(
        new URL(`/auth/signin?oauth_error=${error}`, req.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/auth/signin?oauth_error=no_code', req.url)
      );
    }

    // Exchange code for session using Supabase
    const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

    if (sessionError) {
      console.error('Session exchange error:', sessionError);
      return NextResponse.redirect(
        new URL(`/auth/signin?oauth_error=session_failed`, req.url)
      );
    }

    if (!data.session || !data.user) {
      return NextResponse.redirect(
        new URL('/auth/signin?oauth_error=no_session', req.url)
      );
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile fetch error:', profileError);
    }

    // Create profile if it doesn't exist
    if (!profile) {
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: data.user.id,
          email: data.user.email || '',
          full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || '',
          avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || '',
        });

      if (insertError) {
        console.error('Profile creation error:', insertError);
      }
    }

    // Redirect to auth processing page with session info
    const redirectUrl = new URL('/auth/callback', req.url);
    redirectUrl.searchParams.set('access_token', data.session.access_token);
    redirectUrl.searchParams.set('refresh_token', data.session.refresh_token || '');
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/auth/signin?oauth_error=unknown', req.url)
    );
  }
}
