import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { handleError } from '@/lib/auth-helpers';

// Helper to verify user owns the draft
async function verifyDraftOwnership(id: string, userId: string) {
  const { data: journal } = await supabaseAdmin
    .from('journals')
    .select('id')
    .eq('auth_user_id', userId)
    .maybeSingle();

  if (!journal) {
    return null;
  }

  const { data: draft } = await supabaseAdmin
    .from('posts')
    .select('*')
    .eq('id', id)
    .eq('journal_id', journal.id)
    .maybeSingle();

  return draft;
}

// GET get a single draft
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const draft = await verifyDraftOwnership(params.id, user.id);

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    return NextResponse.json(draft);
  } catch (error) {
    return handleError(error);
  }
}

// PATCH update a draft
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const draft = await verifyDraftOwnership(params.id, user.id);

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    const body = await req.json();

    // Calculate word count if content is being updated
    const updates: any = { ...body };
    if (body.content !== undefined) {
      updates.word_count = body.content.split(/\s+/).length;
      updates.reading_time_minutes = Math.ceil(updates.word_count / 200);
    }

    // Update slug if title changed
    if (body.title && body.title !== draft.title) {
      updates.slug = body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') + '-' + Date.now();
    }

    // Set published_at when status changes to published
    if (body.status === 'published' && draft.status !== 'published' && !draft.published_at) {
      updates.published_at = new Date().toISOString();
    }

    const { data: updated, error } = await supabaseAdmin
      .from('posts')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return handleError(error, 'Failed to update draft');
    }

    return NextResponse.json(updated);
  } catch (error) {
    return handleError(error);
  }
}

// DELETE delete a draft
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const draft = await verifyDraftOwnership(params.id, user.id);

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', params.id);

    if (error) {
      return handleError(error, 'Failed to delete draft');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
