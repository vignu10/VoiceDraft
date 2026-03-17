import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { provider } = await req.json();

    if (provider !== 'google') {
      return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }

    // Get the origin for proper redirect
    const origin = req.headers.get('origin') ||
                   req.headers.get('referer') ||
                   process.env.NEXT_PUBLIC_APP_URL ||
                   'http://localhost:3000';

    // Supabase will redirect to our callback after OAuth
    const redirectTo = new URL('/auth/callback', origin).toString();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        skipBrowserRedirect: false,
      },
    });

    if (error) {
      console.error('OAuth URL generation error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Return the URL - the client will handle the redirect
    return NextResponse.json({ url: data.url });
  } catch (error) {
    console.error('OAuth URL error:', error);
    return NextResponse.json(
      { error: 'Failed to generate OAuth URL' },
      { status: 500 }
    );
  }
}
