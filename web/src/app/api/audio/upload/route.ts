import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { handleError } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
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

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const postId = formData.get('postId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    // Upload to Supabase storage
    const fileName = `${user.id}/${postId}.${file.name.split('.').pop()}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio')
      .upload(fileName, file);

    if (uploadError || !uploadData) {
      return handleError(uploadError, 'Failed to upload audio file');
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('audio')
      .getPublicUrl(uploadData.path);

    // Update post with audio URL
    const { data: post, error: postError } = await supabase
      .from('posts')
      .update({
        audio_file_url: publicUrl,
        audio_s3_key: uploadData.path,
        audio_file_size_bytes: file.size,
        audio_mime_type: file.type,
      })
      .eq('id', postId)
      .select()
      .single();

    if (postError) {
      return handleError(postError, 'Failed to update post with audio URL');
    }

    return NextResponse.json({
      path: uploadData.path,
      fullPath: uploadData.fullPath,
      publicUrl,
    });
  } catch (error) {
    return handleError(error, 'Audio upload failed');
  }
}
