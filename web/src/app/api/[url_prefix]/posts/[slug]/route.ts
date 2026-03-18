import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { handleError } from '@/lib/auth-helpers';
import type { Post } from '@/lib/types';

// GET public blog post by url_prefix and slug
export async function GET(
  req: NextRequest,
  { params }: { params: { url_prefix: string; slug: string } }
) {
  try {
    // First get the journal by url_prefix
    const { data: journal, error: journalError } = await supabase
      .from('journals')
      .select('id')
      .eq('url_prefix', params.url_prefix)
      .eq('is_active', true)
      .maybeSingle();

    if (journalError || !journal) {
      return NextResponse.json({ error: 'Journal not found' }, { status: 404 });
    }

    // Then get the post by slug within that journal
    // Must have BOTH status='published' AND published_at IS NOT NULL
    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('journal_id', journal.id)
      .eq('slug', params.slug)
      .eq('status', 'published')
      .not('published_at', 'is', null)
      .single();

    if (error || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    return handleError(error);
  }
}
