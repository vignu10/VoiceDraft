import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { handleError } from '@/lib/auth-helpers';
import type { Style } from '@/lib/types';

// PUT update user's styles
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

    const { styles } = await req.json();

    if (!Array.isArray(styles) || styles.length !== 3) {
      return NextResponse.json({ error: 'Styles must be an array of 3 styles' }, { status: 400 });
    }

    // Validate each style has required fields
    for (const style of styles) {
      if (!style.name || !style.user_prompt_template || !style.tone || !style.length) {
        return NextResponse.json({ error: 'Each style must have name, user_prompt_template, tone, and length' }, { status: 400 });
      }
    }

    const { data: journal, error } = await supabaseAdmin
      .from('journals')
      .update({
        styles,
        updated_at: new Date().toISOString(),
      })
      .eq('auth_user_id', user.id)
      .select()
      .single();

    if (error) {
      return handleError(error, 'Failed to update styles');
    }

    return NextResponse.json(journal);
  } catch (error) {
    return handleError(error);
  }
}
