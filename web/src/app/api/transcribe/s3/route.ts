import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/openai';
import { handleError } from '@/lib/auth-helpers';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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
    const body = await req.json();
    const { audioKey } = body;

    if (!audioKey) {
      return NextResponse.json(
        { error: 'Audio key is required' },
        { status: 400 }
      );
    }

    // Generate presigned URL for downloading the file
    const bucket = process.env.AWS_S3_BUCKET || 'voicedraft-uploads';
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: audioKey,
    });

    // Generate presigned URL valid for 60 seconds
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

    // Download audio file using the presigned URL
    const response = await fetch(presignedUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to download audio from S3: ${response.statusText}` },
        { status: 400 }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Detect MIME type from file extension or default to m4a
    const mimeType = audioKey?.endsWith('.mp3')
      ? 'audio/mpeg'
      : audioKey?.endsWith('.wav')
      ? 'audio/wav'
      : audioKey?.endsWith('.webm')
      ? 'audio/webm'
      : 'audio/m4a'; // Default to m4a

    // Transcribe using the existing function
    const result = await transcribeAudio(buffer, mimeType);

    return NextResponse.json(result);
  } catch (error) {
    console.error('S3 transcription error:', error);
    return handleError(error, 'Transcription from S3 failed');
  }
}
