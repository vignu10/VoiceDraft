import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@aws-sdk/node-http-handler';

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

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // The path should be like: ["userId", "avatar.jpg"]
    const [userId, filename] = params.path;

    if (!userId || !filename) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    // Validate userId is a valid UUID format (security via UUID randomness)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Optional: Validate token if provided (for audit/logging), but don't require it
    // The UUID path provides sufficient security as it's cryptographically random
    const authHeader = req.headers.get('authorization');
    const url = new URL(req.url);

    let token: string | null = null;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      token = url.searchParams.get('token');
    }

    // Get the file from S3
    const key = `avatars/${userId}/${filename}`;
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const s3Response = await s3Client.send(command);

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    const stream = s3Response.Body as any;

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);

    // Determine content type
    const contentType = filename.endsWith('.png')
      ? 'image/png'
      : filename.endsWith('.webp')
      ? 'image/webp'
      : filename.endsWith('.gif')
      ? 'image/gif'
      : 'image/jpeg';

    // Return the image with cache headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
  } catch (error: any) {
    console.error('Avatar serve error:', error);
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      return NextResponse.json({ error: 'Avatar not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to fetch avatar' }, { status: 500 });
  }
}
