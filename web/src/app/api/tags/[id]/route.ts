import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PATCH /api/tags/[id] - Update a tag
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: user } = await supabase.auth.getUser(token);

    if (!user.user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, color } = body;

    if (!name && !color) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    // Build update object
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name.trim();
    if (color !== undefined) updates.color = color;

    // Update tag
    const { data: tag, error } = await supabase
      .from('tags')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.user.id)
      .select()
      .single();

    if (error) throw error;

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    return NextResponse.json(tag);
  } catch (error) {
    console.error('Error updating tag:', error);
    return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 });
  }
}

// DELETE /api/tags/[id] - Delete a tag
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: user } = await supabase.auth.getUser(token);

    if (!user.user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id } = await params;

    // First, remove tag from all drafts
    await supabase
      .from('draft_tags')
      .delete()
      .eq('tag_id', id);

    // Delete tag
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id)
      .eq('user_id', user.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 });
  }
}
