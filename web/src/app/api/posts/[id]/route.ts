import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { handleError } from '@/lib/auth-helpers';
import type { Post, UpdatePostRequest } from '@/lib/types';

// Helper to verify post ownership
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

  // Get post with journal to verify ownership
  const { data: post } = await supabaseAdmin
    .from('posts')
    .select('journal_id')
    .eq('id', postId)
    .maybeSingle();

  if (!post) {
    return null;
  }

  // Get journal to verify ownership
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

// GET single post
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ownership = await verifyOwnership(req, params.id);

    if (!ownership) {
      return NextResponse.json({ error: 'Post not found or forbidden' }, { status: 404 });
    }

    const { data: post } = await supabaseAdmin
      .from('posts')
      .select('*')
      .eq('id', params.id)
      .single();

    return NextResponse.json(post);
  } catch (error) {
    return handleError(error);
  }
}

// PUT update post
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ownership = await verifyOwnership(req, params.id);

    if (!ownership) {
      return NextResponse.json({ error: 'Post not found or forbidden' }, { status: 404 });
    }

    const body: UpdatePostRequest = await req.json();

    // If changing slug, verify it's unique within journal
    if (body.slug) {
      const { data: existing } = await supabaseAdmin
        .from('posts')
        .select('slug')
        .eq('slug', body.slug)
        .neq('id', params.id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ error: 'Slug already exists in this journal' }, { status: 409 });
      }
    }

    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return handleError(error, 'Failed to update post');
    }

    return NextResponse.json(post);
  } catch (error) {
    return handleError(error);
  }
}

// PATCH partial update post
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ownership = await verifyOwnership(req, params.id);

    if (!ownership) {
      return NextResponse.json({ error: 'Post not found or forbidden' }, { status: 404 });
    }

    const body: UpdatePostRequest = await req.json();

    // If changing slug, verify it's unique within journal
    if (body.slug) {
      const { data: existing } = await supabaseAdmin
        .from('posts')
        .select('slug')
        .eq('slug', body.slug)
        .neq('id', params.id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ error: 'Slug already exists in this journal' }, { status: 409 });
      }
    }

    // Only update fields that are provided
    const updates: any = { ...body };
    updates.updated_at = new Date().toISOString();

    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return handleError(error, 'Failed to update post');
    }

    return NextResponse.json(post);
  } catch (error) {
    return handleError(error);
  }
}

// DELETE post
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ownership = await verifyOwnership(req, params.id);

    if (!ownership) {
      return NextResponse.json({ error: 'Post not found or forbidden' }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', params.id);

    if (error) {
      return handleError(error, 'Failed to delete post');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
