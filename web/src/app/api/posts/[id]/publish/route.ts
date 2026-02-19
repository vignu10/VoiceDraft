import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { handleError } from '@/lib/auth-helpers';

// Helper to verify post ownership (reused from parent route)
async function verifyOwnership(req: NextRequest, postId: string) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return null;
  }

  const { data: post } = await supabaseAdmin
    .from('posts')
    .select('journal_id')
    .eq('id', postId)
    .maybeSingle();

  if (!post) {
    return null;
  }

  const { data: journal } = await supabaseAdmin
    .from('journals')
    .select('auth_user_id')
    .eq('id', post.journal_id)
    .single();

  if (!journal || journal.auth_user_id !== user.id) {
    return null;
  }

  return { user, post };
}

// POST publish post
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ownership = await verifyOwnership(req, params.id);

    if (!ownership) {
      return NextResponse.json({ error: 'Post not found or forbidden' }, { status: 404 });
    }

    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return handleError(error, 'Failed to publish post');
    }

    return NextResponse.json(post);
  } catch (error) {
    return handleError(error);
  }
}
