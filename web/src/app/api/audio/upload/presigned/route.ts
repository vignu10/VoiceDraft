import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { supabase } from '@/lib/supabase';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

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

    const body = await req.json();
    const { filename, contentType } = body;

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: 'Filename and contentType are required' },
        { status: 400 }
      );
    }

    // Generate S3 key with user ID prefix for organization
    const key = `${user.id}/${Date.now()}-${filename}`;
    const bucket = process.env.AWS_S3_BUCKET || 'voicedraft-uploads';

    // Create S3 command for presigned URL
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      // Add metadata for tracking
      Metadata: {
        userId: user.id,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Generate presigned URL valid for 60 seconds
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

    // Generate public URL for accessing the file later
    const publicUrl = `https://${bucket}.s3.${process.env.AWS_REGION || 'eu-north-1'}.amazonaws.com/${key}`;

    return NextResponse.json({
      uploadUrl: presignedUrl,
      key: key,
      publicUrl: publicUrl,
      bucket: bucket,
      region: process.env.AWS_REGION || 'eu-north-1',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate presigned URL', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
