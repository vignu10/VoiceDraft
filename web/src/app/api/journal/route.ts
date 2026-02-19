import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { handleError } from '@/lib/auth-helpers';
import type { Journal, UpdateJournalRequest } from '@/lib/types';

// GET user's journal
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

    const { data: journal, error } = await supabaseAdmin
      .from('journals')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (error) {
      // Journal might not exist yet, return null or create default
      return NextResponse.json(null);
    }

    return NextResponse.json(journal);
  } catch (error) {
    return handleError(error);
  }
}

// PUT update user's journal
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

    const body: UpdateJournalRequest = await req.json();

    // Check if journal exists
    const { data: existingJournal } = await supabaseAdmin
      .from('journals')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (existingJournal) {
      // Update existing
      const { data: journal, error } = await supabaseAdmin
        .from('journals')
        .update({
          ...body,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingJournal.id)
        .select()
        .single();

      if (error) {
        return handleError(error, 'Failed to update journal');
      }

      return NextResponse.json(journal);
    } else {
      // Create new journal with default styles
      const defaultStyles = [
        {
          name: 'Professional',
          user_prompt_template: 'You are an expert blog writer. Transform this transcript into a professional, SEO-optimized blog post:\n\n```{{transcript}}```',
          tone: 'professional',
          length: 'long',
          is_active: true,
        },
        {
          name: 'Casual',
          user_prompt_template: 'You are a friendly blog writer. Transform this transcript into a casual, conversational blog post:\n\n```{{transcript}}```',
          tone: 'casual',
          length: 'medium',
          is_active: true,
        },
        {
          name: 'Technical',
          user_prompt_template: 'You are a technical writer. Transform this transcript into a detailed technical blog post with code examples:\n\n```{{transcript}}```',
          tone: 'technical',
          length: 'long',
          is_active: true,
        },
      ];

      const { data: journal, error } = await supabaseAdmin
        .from('journals')
        .insert({
          auth_user_id: user.id,
          url_prefix: body.url_prefix || user.id.substring(0, 8),
          display_name: body.display_name || `${user.user_metadata?.full_name || 'User'}'s Blog`,
          description: body.description,
          styles: defaultStyles,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        return handleError(error, 'Failed to create journal');
      }

      return NextResponse.json(journal);
    }
  } catch (error) {
    return handleError(error);
  }
}
