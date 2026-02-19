import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@aws-sdk/node-http-handler';
import { handleError } from '@/lib/auth-helpers';

// Initialize S3 client with Node.js HTTP handler
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  requestHandler: new NodeHttpHandler({
    requestTimeout: 30000,
    connectionTimeout: 10000,
  }),
});

const bucket = process.env.AWS_S3_BUCKET || 'voicedraft-uploads';
const region = process.env.AWS_REGION || 'eu-north-1';

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

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Generate S3 key with user ID prefix (overwrites same file)
    const fileExtension = file.name.split('.').pop();
    const key = `avatars/${user.id}/avatar.${fileExtension}`;

    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);

    console.log('Uploading to S3:', { bucket, key, size: buffer.length, contentType: file.type });

    // Upload to S3 (private, no ACL)
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    });

    try {
      await s3Client.send(command);
    } catch (s3Error: any) {
      console.error('S3 upload error:', s3Error);
      return NextResponse.json(
        { error: `S3 upload failed: ${s3Error.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

    // Return the API URL path for accessing the avatar
    const apiUrl = `/api/avatar/${user.id}/avatar.${fileExtension}`;

    return NextResponse.json({
      avatarUrl: apiUrl,
      key: key,
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return handleError(error, 'Avatar upload failed');
  }
}
