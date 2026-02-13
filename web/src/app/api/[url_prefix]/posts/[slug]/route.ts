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
    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('journal_id', journal.id)
      .eq('slug', params.slug)
      .eq('status', 'published')
      .single();

    if (error || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Increment view count
    await supabase
      .from('posts')
      .update({ view_count: (post.view_count || 0) + 1 })
      .eq('id', post.id);

    return NextResponse.json({ ...post, view_count: (post.view_count || 0) + 1 });
  } catch (error) {
    return handleError(error);
  }
}
